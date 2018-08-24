Object.defineProperty(exports, "__esModule", { value: true });
const react_native_storage_1 = require("react-native-storage");
require("./mqttws31");
/**
 * see https://github.com/sunnylqm/react-native-storage for more details
 * @param options {object}
 */
function init(options) {
    localStorage = new react_native_storage_1.default(options);
}
exports.default = init;
