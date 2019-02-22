module.exports = class {
    constructor(success, message, data) {
        this.success = success;
        this.message = !message ? null : message;
        this.data = !data ? [] : data;
    }
}