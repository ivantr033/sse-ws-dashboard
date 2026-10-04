import Entity from './Entity';
import createRequest from './createRequest';

export default class CloudAPI extends Entity {
    constructor() {
        super();
        this.baseUrl = 'http://localhost:3000';
    }

    // GET / -> List of active virtual servers
    list(callback) {
        createRequest({
            url: `${this.baseUrl}/`,
            method: 'GET',
            callback,
        });
    }

    // POST / -> Trigger the creation order
    create(data, callback) {
        createRequest({
            url: `${this.baseUrl}/`,
            method: 'POST',
            data,
            callback,
        });
    }

    // DELETE /?id=<id> -> Delete virtual machine by Query Param
    delete(id, callback) {
        createRequest({
            url: `${this.baseUrl}/?id=${id}`,
            method: 'DELETE',
            callback,
        });
    }
}
