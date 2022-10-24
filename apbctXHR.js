class ApbctXhr{

    xhr = new XMLHttpRequest();

    // Base parameters
    method   = 'POST'; // HTTP-request type
    url      = ''; // URL to send the request
    async    = true;
    user     = null; // HTTP-authorization username
    password = null; // HTTP-authorization password
	data     = {};   // Data to send


	// Optional params
	button      = null; // Button that should be disabled when request is performing
	spinner     = null; // Spinner that should appear when request is in process
	progressbar = null; // Progress bar for the current request
	context     = this; // Context
    callback    = null;
    onErrorCallback = null;

	responseType = 'json'; // Expected data type from server
    headers      = {};
	timeout      = 15000; // Request timeout in milliseconds

    methods_to_convert_data_to_URL = [
        'GET',
        'HEAD',
    ];

    body        = null;
    http_code   = 0;
    status_text = '';

    constructor(parameters){

        console.log('%cXHR%c started', 'color: red; font-weight: bold;', 'color: grey; font-weight: normal;');

        // Set class properties
        for( let key in parameters ){
            if( typeof this[key] !== 'undefined' ){
                this[key] = parameters[key];
            }
        }

        // Modifying DOM-elements
        this.prepare();

        // Modify URL with data for GET and HEAD requests
        if ( Object.keys(this.data).length ) {
            this.deleteDoubleJSONEncoding(this.data);
            this.convertData();
        }

        if( ! this.url ){
            console.log('%cXHR%c not URL provided', 'color: red; font-weight: bold;', 'color: grey; font-weight: normal;')
            return false;
        }

        // Configure the request
        this.xhr.open(this.method, this.url, this.async, this.user, this.password);
        this.setHeaders();

        this.xhr.responseType = this.responseType;
        this.xhr.timeout      = this.timeout;

        /* EVENTS */
        // Monitoring status
        this.xhr.onreadystatechange = function(){
            this.onReadyStateChange();
        }.bind(this);

        // Run callback
        this.xhr.onload = function(){
            this.onLoad();
        }.bind(this);

        // On progress
        this.xhr.onprogress = function(event){
            this.onProgress(event);
        }.bind(this);

        // On error
        this.xhr.onerror = function(){
            this.onError();
        }.bind(this);

        this.xhr.ontimeout = function(){
             this.onTimeout();
        }.bind(this);

        // Send the request
        this.xhr.send(this.body);
    }

    prepare(){

        // Disable button
        if(this.button){
            this.button.setAttribute('disabled', 'disabled');
            this.button.style.cursor = 'not-allowed';
        }

        // Enable spinner
        if(this.spinner) {
            this.spinner.style.display = 'inline';
        }
    }

    complete(){

        this.http_code   = this.xhr.status;
        this.status_text = this.xhr.statusText;

        // Disable button
        if(this.button){
            this.button.removeAttribute('disabled');
			this.button.style.cursor = 'auto';
        }

        // Enable spinner
        if(this.spinner) {
            this.spinner.style.display = 'none';
        }

        if( this.progressbar ) {
            this.progressbar.fadeOut('slow');
        }
    }

    onReadyStateChange(){
        if (this.on_ready_state_change !== null && typeof this.on_ready_state_change === 'function'){
            this.on_ready_state_change();
        }
    }

    onProgress(event) {
        if (this.on_progress !== null && typeof this.on_progress === 'function'){
            this.on_progress();
        }
    }

    onError(){

        console.log('error');

        this.complete();
        this.error(
            this.http_code,
            this.status_text
        );

        if (this.onErrorCallback !== null && typeof this.onErrorCallback === 'function'){
            this.onErrorCallback(this.status_text);
        }
    }

    onTimeout(){
        this.complete();
        this.error(
            0,
            'timeout'
        );

        if (this.onErrorCallback !== null && typeof this.onErrorCallback === 'function'){
            this.onErrorCallback('Timeout');
        }
    }

    onLoad(){

        this.complete();

        if (this.responseType === 'json' ){
            if(this.xhr.response === null){
                this.error(this.http_code, this.status_text, 'No response');
                return false;
            }else if( typeof this.xhr.response.error !== 'undefined') {
                this.error(this.http_code, this.status_text, this.xhr.response.error);
                return false;
            }
        }

        if (this.callback !== null && typeof this.callback === 'function') {
            this.callback.call(this.context, this.xhr.response, this.data);
        }
    }

    error(http_code, status_text, additional_msg){

        let error_string = '';

        if( status_text === 'timeout' ){
            error_string += 'Server response timeout'

        }else if( http_code === 200 ){

			if( status_text === 'parsererror' ){
				error_string += 'Unexpected response from server. See console for details.';
			}else {
				error_string += 'Unexpected error. Status: ' + status_text + '.';
				if( typeof additional_msg !== 'undefined' )
					error_string += ' Additional error info: ' + additional_msg;
			}

		}else if(http_code === 500){
            error_string += 'Internal server error.';

		}else {
            error_string += 'Unexpected response code:' + http_code;
        }

        this.errorOutput( error_string );
    }

    errorOutput(error_msg){
        console.log( '%c ctXHR error: %c' + error_msg, 'color: red;', 'color: grey;' );
    }

    setHeaders(){
        // Set headers if passed
        for( let header_name in this.headers ){
            if( typeof this.headers[header_name] !== 'undefined' ){
                this.xhr.setRequestHeader(header_name, this.headers[header_name]);
            }
        }
    }

    convertData()
    {
        // GET, HEAD request-type
        if( ~this.methods_to_convert_data_to_URL.indexOf( this.method ) ){
            return this.convertDataToURL();

        // POST request-type
        }else{
            return this.convertDataToBody()
        }
    }

    convertDataToURL(){
        let params_appendix = new URLSearchParams(this.data).toString();
        let params_prefix   = this.url.match(/^(https?:\/{2})?[a-z0-9.]+\?/) ? '&' : '?';
        this.url += params_prefix + params_appendix;

        return this.url;
    }

    /**
     *
     * @returns {null}
     */
    convertDataToBody()
    {
    this.body = new FormData();

        for (let dataKey in this.data) {
            this.body.append(
                dataKey,
                typeof this.data[dataKey] === 'object'
                    ? JSON.stringify(this.data[dataKey])
                    : this.data[dataKey]
            );
        }

        return this.body;
    }

    /**
     * Recursive
     *
     * Recursively decode JSON-encoded properties
     *
     * @param object
     * @returns {*}
     */
    deleteDoubleJSONEncoding(object){

        if( typeof object === 'object'){

            for (let objectKey in object) {

                // Recursion
                if( typeof object[objectKey] === 'object'){
                    object[objectKey] = this.deleteDoubleJSONEncoding(object[objectKey]);
                }

                // Common case (out)
                if(
                    typeof object[objectKey] === 'string' &&
                    object[objectKey].match(/^[\[{].*?[\]}]$/) !== null // is like JSON
                ){
                    let parsedValue = JSON.parse(object[objectKey]);
                    if( typeof parsedValue === 'object' ){
                        object[objectKey] = parsedValue;
                    }
                }
            }
        }

        return object;
    }
}
