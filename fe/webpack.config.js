import HtmlWebpackPlugin from "html-webpack-plugin";

export default {
  entry: {
    index: "/jsx/src/index.tsx",
  },
  output: {
    path: "/jsx/out/",
    filename: "bundle.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "index.html",
    }),
  ],
  context: "/jsx/src/",
  resolve: {
    extensions: ["", ".js", ".jsx", ".ts", ".tsx", ".css"],
  },
  module: {
    rules: [
      {
        test: /\.?tsx$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              ["@babel/preset-react", { runtime: "automatic" }],
            ],
          },
        },
      },
      {
        test: /\.s?css$$/i,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(ts|tsx)$/,
        loader: "ts-loader",
      },
    ],
  },
};
