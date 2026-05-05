import {Modal, sendNotification} from '@dbp-toolkit/common';
import {Notification} from '@dbp-toolkit/notification';

export const scopedElements = () => {
    return {
        'dbp-modal': Modal,
        'dbp-notification': Notification,
    };
};

export const sendModalNotification = (
    targetNotificationId,
    summary,
    body,
    type = 'info',
    timeout = null,
    replaceId = null,
) => {
    if (timeout === null) {
        switch (type) {
            case 'info':
            case 'success':
                timeout = 3;
                break;
            case 'warning':
                timeout = 10;
                break;
            case 'danger':
                timeout = 15;
                // delete options.timeout;
                break;
        }
    }

    let options = {
        summary: summary,
        body: body,
        type: type,
        timeout: timeout,
        targetNotificationId: targetNotificationId,
        replaceId: replaceId,
    };

    if (timeout <= 0) {
        delete options.timeout;
    }

    sendNotification(options);
};
