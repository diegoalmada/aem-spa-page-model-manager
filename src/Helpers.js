/*
 * ADOBE CONFIDENTIAL
 *
 * Copyright 2018 Adobe Systems Incorporated
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */
import InternalConstants from "./InternalConstants";

/**
 * Regexp used to extract the context path of a location.
 * The context path is extracted by assuming that the location starts with the context path followed by {@code InternalConstants.DEFAULT_CONTENT_ROOT}.
 */
const CONTEXT_PATH_REGEXP = new RegExp(
    "^(/.*)?(\\" + InternalConstants.DEFAULT_CONTENT_ROOT + ".*)"
);

/**
 * Optional context path of the server. It is used everytime the page model manager attemps to fetch a model from the server.
 * It is initialized by {@code Helpers#externalize}.
 */
let contextPath;

/**
 * Helpers functions related to path manipulation.
 *
 * @namespace Helpers
 */
const Helpers = {
    /**
     * Returns the context path of the given location.
     * If no location is provided, it fallbacks to the current location.
     * @param {String} [location] - Location to be used to detect the context path from.
     * @returns {String}
     */
    getContextPath(location) {
        location = location || this.getCurrentLocation();

        let matches = CONTEXT_PATH_REGEXP.exec(location);
        if (matches && matches[1]) {
            return matches[1];
        } else {
            return "";
        }
    },

    /**
     * Returns the given path externalized by adding the optional context path.
     * @param {string} path - Path to externalize.
     * @returns {string}
     */
    externalize(path) {
        if (contextPath === undefined) {
            contextPath = this.getContextPath();
        }

        if (!contextPath || path.startsWith(contextPath)) {
            return path;
        }

        return contextPath + path;
    },

    /**
     * Returns the given path internalized by removing the optional context path.
     * @param {string} path - Path to internalize.
     * @returns {string}
     */
    internalize(path) {
        if (contextPath === undefined) {
            contextPath = this.getContextPath();
        }

        if (path.startsWith(contextPath)) {
            return path.replace(contextPath, "");
        } else {
            return path;
        }
    },

    /**
     * Returns the URL of the page model to initialize the page model manager with. 
     * It is either derived from a meta tag property called 'cq:page_model_url' or from the given location.
     * If no location is provided, it derives it from the current location.
     * @param {String} [location] - Location to be used to derive the page model URL from.
     * @returns {String}
     */
    getPageModelUrl(location) {
        location = location || this.getCurrentLocation();

        const pageModelMeta = document.querySelector(
            'meta[property="cq:page_model_url"]'
        );
        if (pageModelMeta && pageModelMeta.content) {
            return pageModelMeta.content;
        } else {
            if (location && location.replace) {
                return location.replace(
                    /\.htm(l)?$/,
                    InternalConstants.DEFAULT_MODEL_JSON_EXTENSION
                );
            } else {
                throw new Error(
                    "The page model URL can't be derived from the given location: " +
                        location
                );
            }
        }
    },

    /**
     * Returns the given path after sanitizing it.
     * This function should be called on page paths before storing them in the page model,
     * to make sure only properly formatted paths (e.g., "/content/mypage") are stored.
     * @param {String} path - Path of the page to be sanitized.
     * @return {String}
     */
    sanitize(path) {
        // Remove protocol, domain, port and keep only the path
        path = path.replace(
            /^[a-z]{4}\:\/{2}[a-z]{1,}\:[0-9]{1,4}(\/.*)/,
            "$1"
        );
        // Remove possible selectors
        let selectorIndex = path.indexOf(".");
        path = selectorIndex > -1 ? path.substr(0, selectorIndex) : path;
        // Remove possible context path
        path = this.internalize(path);
        
        return path;
    },

    /**
     * Returns the given path extended with the given extension.
     * @param {String} path - Path to be extended.
     * @param {String} extension - Extension to be added.
     * @returns {String}
     */
    addExtension(path, extension) {
        if (!extension || extension.length < 1) {
            return path;
        }

        if (!extension.startsWith(".")) {
            extension = "." + extension;
        }

        if (!path || path.length < 1 || path.indexOf(extension) > -1) {
            return path;
        }

        let extensionPath = path;

        // Groups
        // 1. the resource
        // 2. the selectors and the extension
        // 3. the suffix
        // 4. the parameters
        let match = /^((?:[\/a-zA-Z0-9:_-]*)+)(?:\.?)([a-zA-Z0-9._-]*)(?:\/?)([a-zA-Z0-9\/\._-]*)(?:\??)([a-zA-Z0-9=&]*)$/g.exec(
            path
        );
        let queue = "";

        if (match && match.length > 2) {
            // suffix
            queue = match[3] ? "/" + match[3] : "";
            // parameters
            queue += match[4] ? "?" + match[4] : "";

            extensionPath =
                match[1] +
                "." +
                match[2].replace(/\.htm(l)?/, extension) +
                queue;
        }

        return extensionPath.indexOf(extension) > -1
            ? extensionPath
            : extensionPath + extension + queue;
    },

    /**
     * Returns the given path extended with the given selector.
     * @param {String} path - Path to be extended.
     * @param {String} selector - Selector to be added.
     * @returns {String}
     */
    addSelector(path, selector) {
        if (!selector || selector.length < 1) {
            return path;
        }

        if (!selector.startsWith(".")) {
            selector = "." + selector;
        }

        if (!path || path.length < 1 || path.indexOf(selector) > -1) {
            return path;
        }

        let index = path.indexOf(".") || path.length;

        if (index < 0) {
            return path + selector;
        }

        return path.slice(0, index) + selector + path.slice(index, path.length);
    },

    /**
     * Returns the current location as a string.
     * @returns {String}
     */
    getCurrentLocation() {
        return window.location.pathname;
    }
};

export default Helpers;
