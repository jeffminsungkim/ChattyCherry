'use strict';

module.exports = ({ functions, firestore }) => {
  return functions.database.ref('/status/{uid}').onUpdate((event) => {
    // Get the data written to Realtime Database
    const eventStatus = event.data.val();
    const userStatusFirestoreRef = firestore.doc(`users/${event.params.uid}`);
    const currentUserEmail = event.auth.variable.email;

    return event.data.ref.once('value').then((statusSnapshot) => {
      return statusSnapshot.val();
    }).then((status) => {
        console.log(currentUserEmail, ':', eventStatus);
        if (status.currentActiveStatus === 'offline' || status.currentActiveStatus === 'signout')
          return userStatusFirestoreRef.update({currentActiveStatus: eventStatus.currentActiveStatus});
    });
  });
};
