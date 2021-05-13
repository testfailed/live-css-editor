import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import TextField from '@material-ui/core/TextField/index.js';

import Button from '@material-ui/core/Button/index.js';
import Dialog from '@material-ui/core/Dialog/index.js';
import DialogActions from '@material-ui/core/DialogActions/index.js';
import DialogContent from '@material-ui/core/DialogContent/index.js';
import DialogTitle from '@material-ui/core/DialogTitle/index.js';

import OAuth from 'oauth-1.0a';
import hmacSha1 from 'crypto-js/hmac-sha1.js';
import Base64 from 'crypto-js/enc-base64.js';

import { Loading } from 'Loading/Loading.js';

import { READYSTATE, STATUSCODE, UNINITIALIZED, LOADING, LOADED, ERROR } from 'constants/readyStates.js';

import {
    APP_$_CLOSE_SEARCH_ICONS_CONFIGURATION,
    APP_$_OPEN_SEARCH_ICONS,
    APP_$_SEARCH_ICONS_CONFIGURATION_SET_ACCESS_KEY,
    APP_$_SEARCH_ICONS_CONFIGURATION_SET_SECRET
} from 'reducers/actionTypes.js';

import './searchIconsConfiguration.css';

function mapStateToProps(state) {
    return {
        open: state.app.searchIcons.openConfiguration,
        accessKey: state.app.searchIcons.accessKey, // Using "accessKey" since it can't be named as "key" becaused that is a reserved prop name
        secret: state.app.searchIcons.secret
    };
}

const SearchIconsConfiguration = function (props) {
    const {
        open,
        accessKey,
        secret
    } = props;

    const [testConnectionStatus, setTestConnectionStatus] = useState({
        [READYSTATE]: UNINITIALIZED
    });

    const setAccessKey = function (accessKey) {
        props.dispatch({
            type: APP_$_SEARCH_ICONS_CONFIGURATION_SET_ACCESS_KEY,
            payload: accessKey
        });

        setTestConnectionStatus({
            [READYSTATE]: UNINITIALIZED
        });
    };
    const setSecret = function (secret) {
        props.dispatch({
            type: APP_$_SEARCH_ICONS_CONFIGURATION_SET_SECRET,
            payload: secret
        });

        setTestConnectionStatus({
            [READYSTATE]: UNINITIALIZED
        });
    };

    if (open) {
        const handleClose = () => {
            props.dispatch({ type: APP_$_CLOSE_SEARCH_ICONS_CONFIGURATION });
            props.dispatch({ type: APP_$_OPEN_SEARCH_ICONS });
        };

        const doTestConnection = async function () {
            // http://lti.tools/oauth/
            const oauth = OAuth({
                consumer: {
                    key: accessKey,
                    secret
                },
                signature_method: 'HMAC-SHA1',
                hash_function(base_string, key) {
                    const hash = hmacSha1(base_string, key);
                    const output = Base64.stringify(hash);
                    return output;
                }
            });

            const request_data = {
                url: `https://api.thenounproject.com/oauth/usage`,
                method: 'GET'
            };
            const headers = oauth.toHeader(oauth.authorize(request_data));

            setTestConnectionStatus({
                [READYSTATE]: LOADING
            });

            const [err, data, coreResponse] = await window.chromeRuntimeMessageToBackgroundScript({
                type: 'magicss-bg',
                subType: 'ajax',
                payload: {
                    url: request_data.url,
                    type: request_data.method,
                    headers
                }
            });

            if (err) {
                setTestConnectionStatus({
                    [READYSTATE]: ERROR,
                    [STATUSCODE]: coreResponse.status,
                });
            } else {
                setTestConnectionStatus({
                    [READYSTATE]: LOADED,
                    [STATUSCODE]: coreResponse.status,
                    data
                });
            }
        };

        const styleForStepTitle = {
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            marginRight: 5,
            minWidth: 42
        };

        return (
            <div>
                <Dialog
                    open={open}
                    onClose={handleClose}
                    disableBackdropClick
                    className="magicss-dialog-search-icons"
                    PaperProps={{
                        style: {
                            maxWidth: 475
                        }
                    }}
                >
                    <DialogTitle id="alert-dialog-title">
                        <span>
                            Configure Access for Noun Project API
                        </span>
                    </DialogTitle>
                    <DialogContent>
                        <div
                            style={{
                                fontFamily: 'Arial, sans-serif',
                                fontSize: 12
                            }}
                        >
                            <div style={{ display: 'flex' }}>
                                <div style={styleForStepTitle}>
                                    Step 1:
                                </div>
                                <div>
                                    Go to Developers page on <a target="_blank" rel="noreferrer" href="https://thenounproject.com/developers/">The Noun Project</a>
                                </div>
                            </div>
                            <div style={{ display: 'flex', marginTop: 4 }}>
                                <div style={styleForStepTitle}>
                                    Step 2:
                                </div>
                                <div>
                                    Choose your plan and register for API access
                                </div>
                            </div>
                            <div style={{ display: 'flex', marginTop: 4 }}>
                                <div style={styleForStepTitle}>
                                    Step 3:
                                </div>
                                <div>
                                    Create an application under the <a target="_blank" rel="noreferrer" href="https://thenounproject.com/developers/apps/">Manage Apps section</a>
                                </div>
                            </div>
                            <div style={{ display: 'flex', marginTop: 4 }}>
                                <div style={styleForStepTitle}>
                                    Step 4:
                                </div>
                                <div>
                                    Paste below the &quot;Key&quot; and &quot;Secret&quot; from the Key Management section in the page for the application
                                </div>
                            </div>
                        </div>
                        <div>
                            <div style={{ marginTop: 25 }}>
                                <TextField
                                    variant="outlined"
                                    size="small"
                                    label="Key"
                                    placeholder="e.g., 0123456789abcdef0123456789abcdef"
                                    value={accessKey}
                                    autoFocus
                                    onChange={(evt) => {
                                        setAccessKey(evt.target.value);
                                    }}
                                    style={{
                                        width: '100%'
                                    }}
                                />
                            </div>
                            <div style={{ marginTop: 25 }}>
                                <TextField
                                    variant="outlined"
                                    size="small"
                                    label="Secret"
                                    placeholder="e.g., 0123456789abcdef0123456789abcdef"
                                    value={secret}
                                    onChange={(evt) => {
                                        setSecret(evt.target.value);
                                    }}
                                    style={{
                                        width: '100%'
                                    }}
                                />
                            </div>

                            <div style={{ marginTop: 25, display: 'flex', fontFamily: 'Arial, sans-serif', fontSize: 14 }}>
                                <Button
                                    onClick={doTestConnection}
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    disabled={ !accessKey || !secret }
                                >
                                    Test Connection
                                </Button>
                                {function () {
                                    const readyState = testConnectionStatus[READYSTATE];
                                    if (readyState === UNINITIALIZED) {
                                        return null;
                                    } else if (readyState === ERROR) {
                                        const statusCode = testConnectionStatus[STATUSCODE];
                                        return (
                                            <div style={{ marginLeft: 15, display: 'flex', alignItems: 'center' }}>
                                                <span style={{ color: '#ff0000' }}>
                                                    {(function () {
                                                        if (statusCode === 0) {
                                                            return 'Network error';
                                                        } else if (statusCode === 401 || statusCode === 403) {
                                                            return 'Authentication error';
                                                        } else {
                                                            return 'Error';
                                                        }
                                                    }())}
                                                </span>
                                            </div>
                                        );
                                    } else if (readyState === LOADED) {
                                        return (
                                            <div style={{ marginLeft: 15, display: 'flex', alignItems: 'center' }}>
                                                <span style={{ color: '#008000' }}>
                                                    Success
                                                </span>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div style={{ marginLeft: 15, display: 'flex', alignItems: 'center' }}>
                                                <Loading type="line-scale" />
                                            </div>
                                        );
                                    }
                                }()}
                            </div>

                            <div style={{ marginTop: 25, fontFamily: 'Arial, sans-serif', fontSize: 12 }}>
                                <span style={{ fontWeight: 'bold' }}>Note:</span> The &quot;Key&quot; and &quot;Secret&quot; are saved in sync storage provided by your browser. They would be synced across your other logged in browser sessions.
                            </div>
                        </div>

                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose} variant="contained" color="primary">
                            Done
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    } else {
        return null;
    }
};
SearchIconsConfiguration.propTypes = {
    open: PropTypes.bool,
    dispatch: PropTypes.func
};

const _SearchIconsConfiguration = connect(mapStateToProps)(SearchIconsConfiguration);

export { _SearchIconsConfiguration as SearchIconsConfiguration };
