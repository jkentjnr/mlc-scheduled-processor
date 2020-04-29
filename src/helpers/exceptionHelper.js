export default class exceptionHelper {

    static asObject(obj) {
        return (obj) ? JSON.parse(JSON.stringify(obj, Object.getOwnPropertyNames(obj))) : null;
    }

    static getMessage(obj) {
        return (!obj) ? 
            null : 
            (obj.action) ? (obj.message || obj) : 
            (obj.message || null);
    }

}