const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp(functions.config().firebase);

var db = admin.firestore();

exports.router = functions.https.onRequest((request, response) => {

    var routerRef = db.collection('routers').doc(request.query.q)

    return db.runTransaction(t => {
        return t.get(routerRef)
            .then(doc => {

                // Check first random addresses
                var random_addresses = doc.data().random_addresses
                shuffle(random_addresses)

                for (i = 0; i < random_addresses.length; i++) {
                    if (Math.random() < random_addresses[i].freq) {
                        response.redirect(random_addresses[i].url);

                        // Update invocation count
                        invocations = doc.data().invocations + 1;
                        routerRef.update({'invocations': invocations});
                        return
                    }
                }

                // Fallback to round-robin addresses
                var round_robin_addresses = doc.data().round_robin_addresses;
                response.redirect(round_robin_addresses[doc.data().current_address]);

                // Update current_address in database
                var current_address = 0;
                if (doc.data().current_address < round_robin_addresses.length - 1) {
                    current_address = doc.data().current_address + 1;
                }

                // And update invocations count
                invocations = doc.data().invocations + 1;
                routerRef.update({'invocations': invocations, 'current_address': current_address});
                return
            });
    }).then(result => {
        return
    }).catch(err => {
        console.log('Transaction failure:', err);
        return
    });
});

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
