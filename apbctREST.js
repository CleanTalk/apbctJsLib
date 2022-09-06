class ApbctRest extends ApbctXhr{

    static default_route = ctPublicFunctions._rest_url + 'cleantalk-antispam/v1/';
    route         = '';

    constructor(...args) {
        args = args[0];
        args.url = ApbctRest.default_route + args.route;
        args.headers = {
            "X-WP-Nonce": ctPublicFunctions._rest_nonce
        };
        super(args);
    }
}
