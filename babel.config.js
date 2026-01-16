module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    'react-native-reanimated/plugin', // <--- This must be the LAST plugin
  ],
};




// module.exports = {
//   presets: ['module:@react-native/babel-preset'],
//   plugins: ['@babel/plugin-transform-export-namespace-from'],
// };
