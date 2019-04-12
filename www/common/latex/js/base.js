function getVariable(el, propertyName) {
    return String(getComputedStyle(el).getPropertyValue('--' + propertyName)).trim();
};

function processTheElements() {
    var thes = document.querySelectorAll('.the');
    for (var i = 0; i < thes.length; i++) {
        var v = getVariable(thes[i], thes[i].getAttribute('display-var'));
        // only mutate if it actually changed
        if (thes[i].textContent != v) {
            thes[i].textContent = v;
        }
    }
}


function _vertical(el, tb) {
    var doc, docEl, rect, win;

    // return zero for disconnected and hidden (display: none) elements, IE <= 11 only
    // running getBoundingClientRect() on a disconnected node in IE throws an error
    if ( !el.getClientRects().length ) {
        return 0;
    }

    rect = el.getBoundingClientRect();

    doc = el.ownerDocument;
    docEl = doc.documentElement;
    win = doc.defaultView;

    return rect[tb] + win.pageYOffset - docEl.clientTop;
}


function offsetTop(el) {
    return _vertical(el, "top");
}

function offsetBottom(el) {
    return _vertical(el, "bottom");
}

function offsetBaseline(el) {
    var mpbaseline = el.querySelector('.mpbaseline');
    return offsetBottom(mpbaseline);
}

function heightAboveBaseline(el) {
    var baseline = offsetBaseline(el);
    var top = offsetTop(el);
    return baseline - top;
}


function positionMarginpars() {
    var mpars = document.querySelectorAll('.marginpar > div');
    var prevBottom = 0;

    mpars.forEach(function(mpar) {
        var mpref = document.querySelector('.body #marginref-' + mpar.id);

        var baselineref = offsetBottom(mpref);
        var heightAB = heightAboveBaseline(mpar);
        var height = mpar.offsetHeight;

        // round to 1 digit
        var top = Math.round((baselineref - heightAB - prevBottom) * 10) / 10;

        // only mutate if it actually changed
        if (mpar.style.marginTop != Math.max(0, top) + "px") {
            mpar.style.marginTop = Math.max(0, top) + "px";
        }

        // if marginTop would have been negative, the element is now further down by that offset => add it to prevBottom
        prevBottom = baselineref - heightAB + height - Math.min(0, top);
    });
}



// don't call resize event handlers too often
var optimizedResize = (function() {
    var callbacks = [],
        running = false;

    // fired on resize event
    function resize() {
        if (!running) {
            running = true;

            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(runCallbacks);
            } else {
                setTimeout(runCallbacks, 66);
            }
        }
    }

    // run the actual callbacks
    function runCallbacks() {
        callbacks.forEach(function(callback) { callback(); });
        running = false;
    }

    // adds callback to loop
    function addCallback(callback) {
        if (callback) {
            callbacks.push(callback);
        }
    }

    return {
        // public method to add additional callback
        add: function(callback) {
            if (!callbacks.length) {
                window.addEventListener('resize', resize);
            }
            addCallback(callback);
        }
    }
}());


// setup event listeners

function completed() {
    document.removeEventListener("DOMContentLoaded", completed);
	window.removeEventListener("load", positionMarginpars);

    var observer = new MutationObserver(function() {
        processTheElements();
        positionMarginpars();
    });

    observer.observe(document, { attributes: true, childList: true, characterData: true, subtree: true });

    // add resize event listener
    optimizedResize.add(positionMarginpars);

    processTheElements();
    positionMarginpars();
}

document.addEventListener("DOMContentLoaded", completed);
window.addEventListener("load", completed);
