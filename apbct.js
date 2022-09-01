class ApbctCore{

    ajax_parameters = {};
    rest_parameters = {};

    #selector = null;
    elements = [];

    // Event properties
    #eventCallback;
    #eventSelector;
    #event;

    /**
     * Default constructor
     */
    constructor(selector){
        this.select(selector);
    }

    /**
     * Get elements by CSS selector
     *
     * @param selector
     * @returns {*}
     */
    select(selector) {

        if(selector instanceof HTMLCollection){
            this.#selector    = null;
            this.elements    = [];
            this.elements = Array.prototype.slice.call(selector);
        }else if( typeof selector === 'object' ){
            this.#selector    = null;
            this.elements    = [];
            this.elements[0] = selector;
        }else if( typeof selector === 'string' ){
            this.#selector = selector;
            this.elements = Array.prototype.slice.call(document.querySelectorAll(selector));
            // this.elements = document.querySelectorAll(selector)[0];
        }else{
            this.#deselect();
        }

        return this;
    }

    #addElement(elemToAdd){
        if( typeof elemToAdd === 'object' ){
            this.elements.push(elemToAdd);
        }else if( typeof elemToAdd === 'string' ){
            this.#selector = elemToAdd;
            this.elements = Array.prototype.slice.call(document.querySelectorAll(elemToAdd));
        }else{
            this.#deselect();
        }
    }

    #push(elem){
        this.elements.push(elem);
    }

    #reduce(){
        this.elements = this.elements.slice(0,-1);
    }

    #deselect(){
        this.elements = [];
    }

    /**
     * Set or get CSS for/of currently selected element
     *
     * @param style
     * @param getRaw
     *
     * @returns {boolean|*}
     */
    css(style, getRaw){

        getRaw = getRaw | false;

        // Set style
        if(typeof style === "object"){

            const stringToCamelCase = str =>
                str.replace(/([-_][a-z])/g, group =>
                    group
                        .toUpperCase()
                        .replace('-', '')
                        .replace('_', '')
                );

            // Apply multiple styles
            for(let style_name in style){
                let DOM_style_name = stringToCamelCase(style_name);

                // Apply to multiple elements (currently selected)
                for(let i=0; i<this.elements.length; i++){
                    this.elements[i].style[DOM_style_name] = style[style_name];
                }
            }

            return this;
        }

        // Get style of first currently selected element
        if(typeof style === 'string'){

            let computedStyle = getComputedStyle(this.elements[0])[style];

            console.log(computedStyle);

            // Process
            if( typeof computedStyle !== 'undefined' && ! getRaw){
                computedStyle = computedStyle.replace(/(\d)(em|pt|%|px){1,2}$/, '$1');                           // Cut of units
                computedStyle = Number(computedStyle) == computedStyle ? Number(computedStyle) : computedStyle; // Cast to INT
                return computedStyle;
            }

            // Return unprocessed
            return computedStyle;
        }
    }

    hide(){
        this.prop('prev-display', this.css('display'));
        this.css({'display': 'none'});
    }

    show(){
        this.css({'display': this.prop('prev-display')});
    }

    addClass(){
        for(let i=0; i<this.elements.length; i++){
            this.elements[i].classList.add(className);
        }
    }

    removeClass(){
        for(let i=0; i<this.elements.length; i++){
            this.elements[i].classList.remove(className);
        }
    }

    toggleClass(className){
        for(let i=0; i<this.elements.length; i++){
            this.elements[i].classList.toggle(className);
        }
    }

    /**
     * Wrapper for apbctAJAX class
     *
     * @param ajax_parameters
     * @returns {ApbctAjax}
     */
    ajax(ajax_parameters){
        this.ajax_parameters = ajax_parameters;
        return new ApbctAjax(ajax_parameters);
    }

    /**
     * Wrapper for apbctREST class
     *
     * @param rest_parameters
     * @returns {ApbctRest}
     */
    rest(rest_parameters){
        this.rest_parameters = rest_parameters;
        return new ApbctRest(rest_parameters);
    }

    /************** EVENTS **************/

    /**
     *
     * Why the mess with arguments?
     *
     * Because we need to support the following function signatures:
     *      on('click',                   function(){ alert('some'); });
     *      on('click', 'inner_selector', function(){ alert('some'); });
     *
     * @param args
     */
    on(...args){

        this.#event         = args[0];
        this.#eventCallback = args[2] || args[1];
        this.#eventSelector = typeof args[1] === "string" ? args[1] : null;

        for(let i=0; i<this.elements.length; i++){
            this.elements[i].addEventListener(
                this.#event,
                this.#eventSelector !== null
                    ? this.#onChecker.bind(this)
                    : this.#eventCallback
            );
        }
    }

    /**
     * Check if a selector of an event matches current target
     *
     * @param event
     * @returns {*}
     */
    #onChecker(event){
        if(event.target === document.querySelector(this.#eventSelector)){
            event.stopPropagation();
            return this.#eventCallback(event);
        }
    }

    ready(callback){
        document.addEventListener('DOMContentLoaded', callback);
    }

    change(callback){
        this.on('change', callback);
    }

    /************** ATTRIBUTES **************/

    /**
     * Get an attribute or property of an element
     *
     * @param attrName
     * @returns {*|*[]}
     */
    attr(attrName){

        let outputValue = [];

        for(let i=0; i<this.elements.length; i++){

            // Use property instead of attribute if possible
            if(typeof this.elements[i][attrName] !== undefined){
                outputValue.push(this.elements[i][attrName]);
            }else{
                outputValue.push(this.elements[i].getAttribute(attrName));
            }
        }

        // Return a single value instead of array if only one value is present
        return outputValue.length === 1 ? outputValue[0] : outputValue;
    }

    prop(propName, value){

        // Setting values
        if(typeof value !== "undefined"){
            for(let i=0; i<this.elements.length; i++){
                this.elements[i][propName] = value;
            }

            return this;

        // Getting values
        }else{

            let outputValue = [];

            for(let i=0; i<this.elements.length; i++){
                outputValue.push(this.elements[i][propName]);
            }

            // Return a single value instead of array if only one value is present
            return outputValue.length === 1 ? outputValue[0] : outputValue;
        }
    }

    /**
     * Set or get inner HTML
     *
     * @param value
     * @returns {*|*[]}
     */
    html(value){
        return typeof value !== 'undefined'
            ? this.prop('innerHTML', value)
            : this.prop('innerHTML');
    }

    /**
     * Set or get value of input tags
     *
     * @param value
     * @returns {*|*[]|undefined}
     */
    val(value){
        return typeof value !== 'undefined'
            ? this.prop('value', value)
            : this.prop('value');
    }

    data(name, value){
        return typeof value !== 'undefined'
            ? this.prop('apbct-data', name, value)
            : this.prop('apbct-data');
    }

    /************** END OF ATTRIBUTES **************/

    /************** FILTERS **************/

    /**
     * Check if the current elements are corresponding to filter
     *
     * @param filter
     * @returns {boolean}
     */
    is(filter){

        let outputValue = false;

        for(let elem of this.elements){
            outputValue ||= this.#isElem(elem, filter);
        }

        return outputValue;
    }

    #isElem(elemToCheck, filter){

        let is = false;
        let isRegisteredTagName = function(name){
            let newlyCreatedElement = document.createElement(name).constructor;
            return ! Boolean( ~[HTMLElement, HTMLUnknownElement].indexOf(newlyCreatedElement) );
        };

        // Check for filter function
        if(typeof filter === 'function') {
            is ||= filter.call(this, elemToCheck);
        }

        // Check for filter function
        if(typeof filter === 'string') {

            // Filter is tag name
            if( filter.match(/^[a-z]/) && isRegisteredTagName(filter) ){
                is ||= elemToCheck.tagName.toLowerCase() === filter.toLowerCase();

            // Filter is property
            }else if( filter.match(/^[a-z]/) ){
                is ||= Boolean(elemToCheck[filter]);

            // Filter is CSS selector
            }else {
                is ||= this.#selector !== null
                    ? document.querySelector(this.#selector + filter) !== null // If possible
                    : this.#isWithoutSelector(elemToCheck, filter);                    // Search through all elems with such selector
            }
        }

        return is;
    }

    #isWithoutSelector(elemToCheck, filter){

        let elems       = document.querySelectorAll(filter);
        let outputValue = false;

        for(let elem of elems){
            outputValue ||= elemToCheck === elem;
        }

        return outputValue;
    }

    filter(filter){

        this.#selector = null;

        for( let i = this.elements.length - 1; i >= 0; i-- ){
            if( ! this.#isElem(this.elements[i], filter) ){
                this.elements.splice(Number(i), 1);
            }
        }

        return this;
    }

    /************** NODES **************/

    parent(filter){

        this.select(this.elements[0].parentElement);

        if( typeof filter !== 'undefined' && ! this.is(filter) ){
            this.#deselect();
        }

        return this;
    }

    parents(filter){

        this.select(this.elements[0]);

        for ( ; this.elements[ this.elements.length - 1].parentElement !== null ; ) {
            this.#push(this.elements[ this.elements.length - 1].parentElement);
        }

        this.elements.splice(0,1); // Deleting initial element from the set

        if( typeof filter !== 'undefined' ){
            this.filter(filter);
        }

        return this;
    }

    children(filter){

        this.select(this.elements[0].children);

        if( typeof filter !== 'undefined' ){
            this.filter(filter);
        }

        return this;
    }

    siblings(filter){

        let current = this.elements[0]; // Remember current to delete it later

        this.parent();
        this.children(filter);
        this.elements.splice(this.elements.indexOf(current), 1); // Remove current element

        return this;
    }

    /************** DOM MANIPULATIONS **************/
    remove(){
        for(let elem of this.elements){
            elem.remove();
        }
    }

    after(content){
        for(let elem of this.elements){
            elem.after(content);
        }
    }

    append(){
        for(let elem of this.elements){
            elem.append(content);
        }
    }


}

/**
 * Hack
 *
 * Make a proxy to keep both properties and methods from:
 *  - the native object and
 *  - the new one from ApbctCore for selected element.
 *
 * For example:
 * apbct('#id).innerHTML = 'some';
 * apbct('#id).css({'backgorund-color': 'black'});
 */
// apbct = new Proxy(
//         apbct,
//         {
//             get(target, prop) {
//                 if (target.elements.length) {
//                     return target.elements[0][prop];
//                 } else {
//                     return null;
//                 }
//             },
//             set(target, prop, value){
//                 if (target.elements.length) {
//                     target.elements[0][prop] = value;
//                     return true;
//                 } else {
//                     return false;
//                 }
//             },
//             apply(target, thisArg, argArray) {
//
//             }
//         }
//     );

/**
 * Enter point to ApbctCore class
 *
 * @param params
 * @returns {*}
 */
function apbct(params){
    return new ApbctCore()
        .select(params);
}