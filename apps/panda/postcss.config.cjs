// `@pandacss/postcss` exports the plugin factory under `.default`, which the
// object form of the plugins field does not unwrap — hence the explicit call.
const pandacss = require("@pandacss/postcss");

module.exports = {
  plugins: [(pandacss.default ?? pandacss)()],
};
