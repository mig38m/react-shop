import React from "react";
import { Query, Mutation } from "react-apollo";
import gql from "graphql-tag";
import { List, Avatar, Button } from "antd";
import { Link } from "react-router-dom";
import Loading from "../base/Loading";

const USER_CART_LIST = gql`
  query userCartList {
    userCartList {
      itemId
      item {
        name
        cover
        price
      }
      count
    }
  }
`;

const DELETE_CART_ITEM = gql`
  mutation deleteCartItem($id: ID!) {
    deleteCartItem(id: $id)
  }
`;

const CartList = ({ data }) => (
  <List
    itemLayout="horizontal"
    dataSource={data}
    renderItem={item => (
      <List.Item>
        <List.Item.Meta
          avatar={<Avatar src={item.item.cover} />}
          title={<Link to={`/item/${item.itemId}`}>{item.item.name}</Link>}
          description={`￥${item.item.price}.00`}
        />
        <p style={{lineHeight:"32px",marginRight:"10px"}}>{item.count}</p>
        <DeleteCartItem id={item.itemId} />
      </List.Item>
    )}
  />
);

const Cart = () => (
  <Query query={USER_CART_LIST}>
    {({ loading, error, data }) => {
      return (
        <div>
          <Loading loading={loading} error={error} />
          <CartList data={data.userCartList} />
        </div>
      );
    }}
  </Query>
);

const DeleteCartItem = prams => (
  <Mutation
    mutation={DELETE_CART_ITEM}
    update={cache => {
      const { userCartList } = cache.readQuery({ query: USER_CART_LIST });
      cache.writeQuery({
        query: USER_CART_LIST,
        data: {
          userCartList: userCartList.filter(val => val.itemId !== prams.id)
        }
      });
    }}
  >
    {(deleteCartItem, { loading, error }) => (
      <div style={{ display: "inline" }}>
        <Button
          style={{ display: "inline" }}
          type="danger"
          onClick={() => deleteCartItem({ variables: prams })}
        >
          Delete
        </Button>
        <Loading loading={loading} error={error} />
      </div>
    )}
  </Mutation>
);

export default Cart;