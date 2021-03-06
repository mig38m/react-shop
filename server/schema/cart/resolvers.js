const { ObjectID } = require('mongodb');

module.exports = {
  Query: {
    userCartList: async (root, data, { user, mongo: { Carts } }) => {
      if (!user) {
        return [];
      }
      const cartItems = await Carts.find({ uid: user._id }).toArray();// eslint-disable-line
      return cartItems;
    },
  },
  Mutation: {
    saveCartItem: async (root, data, { user, mongo: { Carts, Items } }) => {
      const { cartItem } = data;
      const errorObj = {
        id: 0, itemId: '', uid: '', count: 0,
      };

      if (!user || !Number(cartItem.count)) {
        return errorObj;
      }
      const item = await Items.findOne({
        _id: ObjectID(cartItem.itemId),
      });

      if (!item) {
        return errorObj;
      }

      let { count } = cartItem;

      const existCartItem = await Carts.findOne({
        uid: user._id,// eslint-disable-line
        itemId: cartItem.itemId,
      });
      if (existCartItem && existCartItem.count) {
        if (item.stock < existCartItem.count + cartItem.count) {
          return {
            message: 'stock not enough!',
          };
        }
        count += existCartItem.count;
      }

      const cartItemObj = {
        uid: user._id,// eslint-disable-line
        count,
        itemId: cartItem.itemId,
        item: {
          id: item._id,// eslint-disable-line
          name: item.name,
          cover: item.cover,
          price: item.price,
        },
      };
      const ret = await Carts.update(
        { uid: user._id, itemId: cartItem.itemId },// eslint-disable-line
        cartItemObj,
        { upsert: true },
      );
      if (ret.result.nModified > 0 || ret.result.upserted) {
        return { cartItem: cartItemObj };
      }
      return { message: 'add to cart fail!' };
    },
    deleteCartItem: async (root, data, { mongo: { Carts } }) => {
      const response = await Carts.deleteOne({
        itemId: data.id,
      });
      if (response.deletedCount === 1) {
        return data.id;
      }
      return response.deletedCount;
    },
  },
  LessItem: {
    id: root => root._id || root.id,// eslint-disable-line
  },
  CartItem: {
    id: root => root._id || root.id,// eslint-disable-line
  },
};
