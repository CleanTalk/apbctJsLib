class ApbctRest extends ApbctXhr{

    default_route = ctPublicFunctions._rest_url + 'cleantalk-antispam/v1/';
    route         = '';

    constructor(...args) {

        args.url = this.default_route + args.route;
        args.headers['X-WP-Nonce'] = ctPublicFunctions._rest_nonce;

        super(...args);
    }
}