const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
    res.json({ data: orders});
}

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId)
    if(foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order id not found: ${orderId}`,
    });
};

function bodyDataHas(propertyName) {
    return function(req, res, next) {
        const { data } = req.body;
        if (data[propertyName]) {
            return next();
        }
        next({ status: 400, message: `Order must include a ${propertyName}`})
    };
}

function deliverToPropertyIsValid(req, res, next) {
    const { data } = req.body;
    if(data.deliverTo && data.deliverTo.length > 0) {
        return next();
    }
    next({
        status: 400,
        message: `Order must include a deliverTo`
    });
}

function mobileNumberPropertyIsValid(req, res, next) {
    const { data } = req.body;
    if(data.mobileNumber && data.mobileNumber.length > 0) {
        return next();
    }
    next({
        status: 400,
        message: `Order must include a mobile number`
    })
}

function statusPropertyIsValid(req, res, next) {
    const { data: { status } } = req.body;
    const order = res.locals.order;
  
    if (status && status !== order.status) {
      return next({
        status: 400,
        message: "status",
      });
    }
  
    return next();
  }


function dishesPropertyIsValid(req, res, next) {
    const { data: { dishes = [] } = {} } = req.body;

    if(!Array.isArray(dishes) || dishes.length === 0 ){
        return next({
            status: 400,
            message: "Order must include at least one dish",
        });
    }

    for (let index = 0; index < dishes.length; index++ ) {
        const { quantity } = dishes[index];

        if (quantity === undefined) {
            return next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`,
            });
        }

        if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0) {
            return next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`,
            });
        }
    }
    return next();
}

function checkOrderIdMatch(req, res, next) {
    const { orderId } = req.params;
    const {data: { id } = {} } =req.body;

    if(id && id !== orderId) {
        return next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
        })
    }
    next();
}

function deleteValidator(req, res, next) {
    const order = res.locals.order;

    if(order.status !== "pending") {
        return next({
            status: 400,
            message: "An order cannot be deleted unless it is pending."
        });
    }
    next();
}

function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId)
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
}

function update(req, res) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({ data: order });
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
      id: nextId(),
      deliverTo,
      mobileNumber,
      status,
      dishes,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
  }

function read(req, res, next) {
    res.json({ data: res.locals.order })
};

module.exports = {
    create: [
       bodyDataHas("deliverTo"),
       bodyDataHas("mobileNumber"),
       bodyDataHas("dishes"),
       deliverToPropertyIsValid,
       mobileNumberPropertyIsValid,
       dishesPropertyIsValid,
       create,
    ],
    list,
    read: [orderExists, read],
    update: [
        orderExists,
        checkOrderIdMatch,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        bodyDataHas("status"),
        deliverToPropertyIsValid,
        mobileNumberPropertyIsValid,
        dishesPropertyIsValid,
        statusPropertyIsValid,
        update,
    ],
    delete: [orderExists, deleteValidator, destroy],
};