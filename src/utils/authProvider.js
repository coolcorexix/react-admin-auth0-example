import { fetchUtils } from 'react-admin';
import authConfig from "./authConfig";
import {Auth0Client} from '@auth0/auth0-spa-js';

const auth0 = new Auth0Client({
    domain: authConfig.domain,
    client_id: authConfig.clientID,
    redirect_uri: authConfig.redirectURI,
    cacheLocation: 'localstorage',
    useRefreshTokens: true
});


export const httpClient = async (url, options = {}) => {
    const accessToken = await auth0.getTokenSilently();
    if (!options.headers) {
        options.headers = new Headers({ Accept: 'application/json' });
    }
    // add your own headers here
    options.headers.set('Authorization', 'Bearer ' + accessToken);
    return fetchUtils.fetchJson(url, options);
};

export default {
    // called when the user attempts to log in
    login: (url) => {
        console.log("🚀 ~ file: authProvider.js ~ line 15 ~ url", url)
        if (typeof url === 'undefined') {
            return auth0.loginWithRedirect()
        }
        return auth0.handleRedirectCallback(url.location);
    },
    // called when the user clicks on the logout button
    logout: () => {
        return auth0.isAuthenticated().then(function (isAuthenticated) {
            if (isAuthenticated) { // need to check for this as react-admin calls logout in case checkAuth failed
                return auth0.logout({
                    redirect_uri: window.location.origin,
                    federated: true // have to be enabled to invalidate refresh token
                });
            }
            return Promise.resolve()
        })
    },
    // called when the API returns an error
    checkError: ({status}) => {
        if (status === 401 || status === 403) {
            return Promise.reject();
        }
        return Promise.resolve();
    },
    // called when the user navigates to a new location, to check for authentication
    checkAuth: (checkAuthArg) => {
        console.log("🚀 ~ file: authProvider.js ~ line 42 ~ checkAuthArg", checkAuthArg)
        return auth0.isAuthenticated().then(async (isAuthenticated) => {
            console.log('at check auth');
            if (isAuthenticated) {
                console.log('is authenticated');
                return Promise.resolve();
            }
            console.log('is not authenticated');
            try {
                const tokenSilentRs = await auth0.getTokenSilently();
                console.log("🚀 ~ file: authProvider.js ~ line 52 ~ tokenSilentRs", tokenSilentRs)
            } catch {
                console.log('in the catch')
                return auth0.loginWithRedirect({
                    url: checkAuthArg.url,
                })
            }
        })
    },
    // called when the user navigates to a new location, to check for permissions / roles
    getPermissions: () => {
        return Promise.resolve()
    },
};
