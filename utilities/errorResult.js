module.exports = class {
    constructor(code, message) {
        this.code = code;
        this.error_msg = !message ? null : message;
    }
}