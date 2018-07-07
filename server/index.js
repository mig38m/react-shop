const koa = require("koa"); // koa@2
const koaRouter = require("koa-router");
const koaBody = require("koa-bodyparser");
const fs = require("fs");
const parse = require("busboy-file-parser")

const cors = require('koa2-cors');
const path = require('path');
const os = require('os');
const { graphqlKoa, graphiqlKoa } = require("apollo-server-koa");
const connectMongo = require("./schema/mongo-connector");
const passportSchema = require("./schema/passport");
const itemSchema = require("./schema/item");
const cartSchema = require("./schema/cart");
const orderSchema = require("./schema/order");
const { mergeSchemas } = require("graphql-tools");
const { authenticate } = require("./authentication");
const app = new koa();
const router = new koaRouter();
const PORT = 3001;
const schema = mergeSchemas({
  schemas: [
    passportSchema,
    itemSchema,
    cartSchema,
    orderSchema
  ]
});

const start = async () => {
  const mongo = await connectMongo();

  const buildOptions = async (req, res) => {
    const user = await authenticate(req, mongo.Users);
    return {
      context: {
        mongo,
        user,
        req
      },
      schema
    };
  };

  // koaBody is needed just for POST.
  // app.use(async (ctx, next) => {
  //   await next();
  //   ctx.set("access-control-allow-credentials", "true");
  //   ctx.set("access-control-allow-headers", "Content-Type,Access-Token");
  //   ctx.set("Access-Control-allow-methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");
  //   ctx.set("access-control-allow-origin", "http://localhost:3000");
  // });
  app.use(koaBody({ multipart: true }));


  app.use(cors({
    origin: function(ctx) {
      return 'http://localhost:3000';
    },
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    maxAge: 5,
    credentials: true,
    allowMethods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  }));

  router.post('/upload',async function(ctx, next) {
     const {files} = await parse(ctx.req);
     const fileId = Math.random().toString();
     const reader = fs.createReadStream(files[0].path);
     const stream = fs.createWriteStream(path.join(os.tmpdir(), fileId));
     reader.pipe(stream);
     console.log('uploading %s -> %s', files[0].name, stream.path); 
     ctx.body = `{"id":"${fileId}"}`;
  });

  router.post("/graphql", graphqlKoa(buildOptions));
  router.get("/graphql", graphqlKoa(buildOptions));
  // Setup the /graphiql route to show the GraphiQL UI
  router.get(
    "/graphiql",
    graphiqlKoa({
      endpointURL: "/graphql" // a POST endpoint that GraphiQL will make the actual requests to
    })
  );

  app.use(router.routes());
  app.use(router.allowedMethods());
  app.listen(PORT);
};

start();
