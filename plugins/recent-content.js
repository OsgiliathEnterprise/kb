const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

function pluginRecentContent() {
  return {
    name: 'plugin-recent-content',
    configureWebpack(config, isServer, utils) {
      // Read the whats-new.json file
      const jsonPath = path.join(__dirname, '..', 'static', 'whats-new.json');
      let data = [];
      try {
        data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch (e) {
        // File doesn't exist yet, use empty array
      }
      
      // Inject as a global constant
      return {
        plugins: [
          new webpack.DefinePlugin({
            RECENT_CONTENT_DATA: JSON.stringify(data),
          }),
        ],
      };
    },
  };
}

module.exports = pluginRecentContent;
