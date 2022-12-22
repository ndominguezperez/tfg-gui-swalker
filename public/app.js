(function () {
    'use strict';

    function evaluatePolySegment(xVals, segmentCoeffs, x) {
        var i = binarySearch(xVals, x);
        if (i < 0) {
            i = -i - 2;
        }
        i = Math.max(0, Math.min(i, segmentCoeffs.length - 1));
        return evaluatePoly(segmentCoeffs[i], x - xVals[i]);
    }
    function evaluatePoly(c, x) {
        var n = c.length;
        if (n == 0) {
            return 0;
        }
        var v = c[n - 1];
        for (var i = n - 2; i >= 0; i--) {
            v = x * v + c[i];
        }
        return v;
    }
    function trimPoly(c) {
        var n = c.length;
        while (n > 1 && c[n - 1] == 0) {
            n--;
        }
        return (n == c.length) ? c : c.subarray(0, n);
    }
    function checkMonotonicallyIncreasing(a) {
        for (var i = 0; i < a.length; i++) {
            if (!isFinite(a[i])) {
                throw new Error("Non-finite number detected.");
            }
            if (i > 0 && a[i] < a[i - 1]) {
                throw new Error("Number sequence is not monotonically increasing.");
            }
        }
    }
    function checkStrictlyIncreasing(a) {
        for (var i = 0; i < a.length; i++) {
            if (!isFinite(a[i])) {
                throw new Error("Non-finite number detected.");
            }
            if (i > 0 && a[i] <= a[i - 1]) {
                throw new Error("Number sequence is not strictly increasing.");
            }
        }
    }
    function checkFinite(a) {
        for (var i = 0; i < a.length; i++) {
            if (!isFinite(a[i])) {
                throw new Error("Non-finite number detected.");
            }
        }
    }
    function binarySearch(a, key) {
        var low = 0;
        var high = a.length - 1;
        while (low <= high) {
            var mid = (low + high) >>> 1;
            var midVal = a[mid];
            if (midVal < key) {
                low = mid + 1;
            }
            else if (midVal > key) {
                high = mid - 1;
            }
            else if (midVal == key) {
                return mid;
            }
            else {
                throw new Error("Invalid number encountered in binary search.");
            }
        }
        return -(low + 1);
    }
    function getMedian(a) {
        var n = a.length;
        if (n < 1) {
            return NaN;
        }
        var a2 = new Float64Array(a);
        a2.sort();
        var m = Math.floor(n / 2);
        if (n % 2 == 0) {
            return (a2[m - 1] + a2[m]) / 2;
        }
        else {
            return a2[m];
        }
    }

    var EPSILON = Number.EPSILON || 2.2204460492503130808472633361816E-16;
    function createAkimaSplineInterpolator(xVals, yVals) {
        var segmentCoeffs = computeAkimaPolyCoefficients(xVals, yVals);
        var xValsCopy = Float64Array.from(xVals);
        return function (x) { return evaluatePolySegment(xValsCopy, segmentCoeffs, x); };
    }
    function computeAkimaPolyCoefficients(xVals, yVals) {
        if (xVals.length != yVals.length) {
            throw new Error("Dimension mismatch for xVals and yVals.");
        }
        if (xVals.length < 5) {
            throw new Error("Number of points is too small.");
        }
        checkStrictlyIncreasing(xVals);
        var n = xVals.length - 1;
        var differences = new Float64Array(n);
        var weights = new Float64Array(n);
        for (var i = 0; i < n; i++) {
            differences[i] = (yVals[i + 1] - yVals[i]) / (xVals[i + 1] - xVals[i]);
        }
        for (var i = 1; i < n; i++) {
            weights[i] = Math.abs(differences[i] - differences[i - 1]);
        }
        var firstDerivatives = new Float64Array(n + 1);
        for (var i = 2; i < n - 1; i++) {
            var wP = weights[i + 1];
            var wM = weights[i - 1];
            if (Math.abs(wP) < EPSILON && Math.abs(wM) < EPSILON) {
                var xv = xVals[i];
                var xvP = xVals[i + 1];
                var xvM = xVals[i - 1];
                firstDerivatives[i] = (((xvP - xv) * differences[i - 1]) + ((xv - xvM) * differences[i])) / (xvP - xvM);
            }
            else {
                firstDerivatives[i] = ((wP * differences[i - 1]) + (wM * differences[i])) / (wP + wM);
            }
        }
        firstDerivatives[0] = differentiateThreePoint(xVals, yVals, 0, 0, 1, 2);
        firstDerivatives[1] = differentiateThreePoint(xVals, yVals, 1, 0, 1, 2);
        firstDerivatives[n - 1] = differentiateThreePoint(xVals, yVals, n - 1, n - 2, n - 1, n);
        firstDerivatives[n] = differentiateThreePoint(xVals, yVals, n, n - 2, n - 1, n);
        return computeHermitePolyCoefficients(xVals, yVals, firstDerivatives);
    }
    function differentiateThreePoint(xVals, yVals, indexOfDifferentiation, indexOfFirstSample, indexOfSecondsample, indexOfThirdSample) {
        var x0 = yVals[indexOfFirstSample];
        var x1 = yVals[indexOfSecondsample];
        var x2 = yVals[indexOfThirdSample];
        var t = xVals[indexOfDifferentiation] - xVals[indexOfFirstSample];
        var t1 = xVals[indexOfSecondsample] - xVals[indexOfFirstSample];
        var t2 = xVals[indexOfThirdSample] - xVals[indexOfFirstSample];
        var a = (x2 - x0 - (t2 / t1 * (x1 - x0))) / (t2 * t2 - t1 * t2);
        var b = (x1 - x0 - a * t1 * t1) / t1;
        return (2 * a * t) + b;
    }
    function computeHermitePolyCoefficients(xVals, yVals, firstDerivatives) {
        if (xVals.length != yVals.length || xVals.length != firstDerivatives.length) {
            throw new Error("Dimension mismatch");
        }
        if (xVals.length < 2) {
            throw new Error("Not enough points.");
        }
        var n = xVals.length - 1;
        var segmentCoeffs = new Array(n);
        for (var i = 0; i < n; i++) {
            var w = xVals[i + 1] - xVals[i];
            var w2 = w * w;
            var yv = yVals[i];
            var yvP = yVals[i + 1];
            var fd = firstDerivatives[i];
            var fdP = firstDerivatives[i + 1];
            var coeffs = new Float64Array(4);
            coeffs[0] = yv;
            coeffs[1] = firstDerivatives[i];
            coeffs[2] = (3 * (yvP - yv) / w - 2 * fd - fdP) / w;
            coeffs[3] = (2 * (yv - yvP) / w + fd + fdP) / w2;
            segmentCoeffs[i] = trimPoly(coeffs);
        }
        return segmentCoeffs;
    }

    function createCubicSplineInterpolator(xVals, yVals) {
        var segmentCoeffs = computeCubicPolyCoefficients(xVals, yVals);
        var xValsCopy = Float64Array.from(xVals);
        return function (x) { return evaluatePolySegment(xValsCopy, segmentCoeffs, x); };
    }
    function computeCubicPolyCoefficients(xVals, yVals) {
        if (xVals.length != yVals.length) {
            throw new Error("Dimension mismatch.");
        }
        if (xVals.length < 3) {
            throw new Error("Number of points is too small.");
        }
        checkStrictlyIncreasing(xVals);
        var n = xVals.length - 1;
        var h = new Float64Array(n);
        for (var i = 0; i < n; i++) {
            h[i] = xVals[i + 1] - xVals[i];
        }
        var mu = new Float64Array(n);
        var z = new Float64Array(n + 1);
        mu[0] = 0;
        z[0] = 0;
        for (var i = 1; i < n; i++) {
            var g = 2 * (xVals[i + 1] - xVals[i - 1]) - h[i - 1] * mu[i - 1];
            mu[i] = h[i] / g;
            z[i] = (3 * (yVals[i + 1] * h[i - 1] - yVals[i] * (xVals[i + 1] - xVals[i - 1]) + yVals[i - 1] * h[i]) /
                (h[i - 1] * h[i]) - h[i - 1] * z[i - 1]) / g;
        }
        var b = new Float64Array(n);
        var c = new Float64Array(n + 1);
        var d = new Float64Array(n);
        z[n] = 0;
        c[n] = 0;
        for (var i = n - 1; i >= 0; i--) {
            var dx = h[i];
            var dy = yVals[i + 1] - yVals[i];
            c[i] = z[i] - mu[i] * c[i + 1];
            b[i] = dy / dx - dx * (c[i + 1] + 2 * c[i]) / 3;
            d[i] = (c[i + 1] - c[i]) / (3 * dx);
        }
        var segmentCoeffs = new Array(n);
        for (var i = 0; i < n; i++) {
            var coeffs = new Float64Array(4);
            coeffs[0] = yVals[i];
            coeffs[1] = b[i];
            coeffs[2] = c[i];
            coeffs[3] = d[i];
            segmentCoeffs[i] = trimPoly(coeffs);
        }
        return segmentCoeffs;
    }

    function createLinearInterpolator(xVals, yVals) {
        var segmentCoeffs = computeLinearPolyCoefficients(xVals, yVals);
        var xValsCopy = Float64Array.from(xVals);
        return function (x) { return evaluatePolySegment(xValsCopy, segmentCoeffs, x); };
    }
    function computeLinearPolyCoefficients(xVals, yVals) {
        if (xVals.length != yVals.length) {
            throw new Error("Dimension mismatch.");
        }
        if (xVals.length < 2) {
            throw new Error("Number of points is too small.");
        }
        checkStrictlyIncreasing(xVals);
        var n = xVals.length - 1;
        var segmentCoeffs = new Array(n);
        for (var i = 0; i < n; i++) {
            var dx = xVals[i + 1] - xVals[i];
            var dy = yVals[i + 1] - yVals[i];
            var m = dy / dx;
            var c = new Float64Array(2);
            c[0] = yVals[i];
            c[1] = m;
            segmentCoeffs[i] = trimPoly(c);
        }
        return segmentCoeffs;
    }

    function createNearestNeighborInterpolator(xVals, yVals) {
        var xVals2 = Float64Array.from(xVals);
        var yVals2 = Float64Array.from(yVals);
        var n = xVals2.length;
        if (n != yVals2.length) {
            throw new Error("Dimension mismatch for xVals and yVals.");
        }
        if (n == 0) {
            return function (_x) {
                return NaN;
            };
        }
        if (n == 1) {
            return function (_x) {
                return yVals2[0];
            };
        }
        checkStrictlyIncreasing(xVals2);
        return function (x) {
            var i = binarySearch(xVals2, x);
            if (i >= 0) {
                return yVals2[i];
            }
            i = -i - 1;
            if (i == 0) {
                return yVals2[0];
            }
            if (i >= n) {
                return yVals2[n - 1];
            }
            var d = x - xVals2[i - 1];
            var w = xVals2[i] - xVals2[i - 1];
            return (d + d < w) ? yVals2[i - 1] : yVals2[i];
        };
    }

    function createLoessInterpolator(parms) {
        var _a = parms.interpolationMethod, interpolationMethod = _a === void 0 ? "akima" : _a, _b = parms.minXDistance, minXDistance = _b === void 0 ? getDefaultMinXDistance(parms.xVals) : _b, diagInfo = parms.diagInfo;
        var fitYVals = smooth(parms);
        var knotFilter = createKnotFilter(parms.xVals, fitYVals, minXDistance);
        var knotXVals = filterNumberArray(parms.xVals, knotFilter);
        var knotYVals = filterNumberArray(fitYVals, knotFilter);
        if (diagInfo) {
            diagInfo.fitYVals = fitYVals;
            diagInfo.knotFilter = knotFilter;
            diagInfo.knotXVals = knotXVals;
            diagInfo.knotYVals = knotYVals;
        }
        return createInterpolatorWithFallback(interpolationMethod, knotXVals, knotYVals);
    }
    function createKnotFilter(xVals, fitYVals, minXDistance) {
        var n = xVals.length;
        var filter = Array(n);
        var prevX = -Infinity;
        for (var i = 0; i < n; i++) {
            var x = xVals[i];
            var y = fitYVals[i];
            if (x - prevX >= minXDistance && !isNaN(y)) {
                filter[i] = true;
                prevX = x;
            }
            else {
                filter[i] = false;
            }
        }
        return filter;
    }
    function filterNumberArray(a, filter) {
        var n = a.length;
        var a2 = new Float64Array(n);
        var n2 = 0;
        for (var i = 0; i < n; i++) {
            if (filter[i]) {
                a2[n2++] = a[i];
            }
        }
        return a2.subarray(0, n2);
    }
    function getDefaultMinXDistance(xVals) {
        var n = xVals.length;
        if (n == 0) {
            return NaN;
        }
        var xRange = xVals[n - 1] - xVals[0];
        if (xRange == 0) {
            return 1;
        }
        return xRange / 100;
    }
    function smooth(parms) {
        var xVals = parms.xVals, yVals = parms.yVals, weights = parms.weights, _a = parms.bandwidthFraction, bandwidthFraction = _a === void 0 ? 0.3 : _a, _b = parms.robustnessIters, robustnessIters = _b === void 0 ? 2 : _b, _c = parms.accuracy, accuracy = _c === void 0 ? 1E-12 : _c, _d = parms.outlierDistanceFactor, outlierDistanceFactor = _d === void 0 ? 6 : _d, diagInfo = parms.diagInfo;
        checkMonotonicallyIncreasing(xVals);
        checkFinite(yVals);
        if (weights) {
            checkFinite(weights);
        }
        var n = xVals.length;
        if (yVals.length != n || weights && weights.length != n) {
            throw new Error("Dimension mismatch.");
        }
        if (diagInfo) {
            diagInfo.robustnessIters = 0;
            diagInfo.secondLastMedianResidual = undefined;
            diagInfo.lastMedianResidual = undefined;
            diagInfo.robustnessWeights = undefined;
        }
        if (n <= 2) {
            return Float64Array.from(yVals);
        }
        var fitYVals = undefined;
        for (var iter = 0; iter <= robustnessIters; iter++) {
            var robustnessWeights = undefined;
            if (iter > 0) {
                var residuals = absDiff(fitYVals, yVals);
                var medianResidual = getMedian(residuals);
                if (medianResidual < accuracy) {
                    if (diagInfo) {
                        diagInfo.lastMedianResidual = medianResidual;
                    }
                    break;
                }
                var outlierDistance = medianResidual * outlierDistanceFactor;
                robustnessWeights = calculateRobustnessWeights(residuals, outlierDistance);
                if (diagInfo) {
                    diagInfo.robustnessIters = iter;
                    diagInfo.secondLastMedianResidual = medianResidual;
                    diagInfo.robustnessWeights = robustnessWeights;
                }
            }
            var combinedWeights = combineWeights(weights, robustnessWeights);
            fitYVals = calculateSequenceRegression(xVals, yVals, combinedWeights, bandwidthFraction, accuracy, iter);
        }
        return fitYVals;
    }
    function calculateSequenceRegression(xVals, yVals, weights, bandwidthFraction, accuracy, iter) {
        var n = xVals.length;
        var n2 = weights ? countNonZeros(weights) : n;
        if (n2 < 2) {
            throw new Error("Not enough relevant points in iteration " + iter + ".");
        }
        var bandwidthInPoints = Math.max(2, Math.min(n2, Math.round(n2 * bandwidthFraction)));
        var bw = findInitialBandwidthInterval(weights, bandwidthInPoints, n);
        var fitYVals = new Float64Array(n);
        for (var i = 0; i < n; i++) {
            var x = xVals[i];
            moveBandwidthInterval(bw, x, xVals, weights);
            fitYVals[i] = calculateLocalLinearRegression(xVals, yVals, weights, x, bw.iLeft, bw.iRight, accuracy);
        }
        return fitYVals;
    }
    function calculateLocalLinearRegression(xVals, yVals, weights, x, iLeft, iRight, accuracy) {
        var maxDist = Math.max(x - xVals[iLeft], xVals[iRight] - x) * 1.001;
        if (maxDist < 0) {
            throw new Error("Inconsistent bandwidth parameters.");
        }
        if (maxDist == 0) {
            maxDist = 1;
        }
        var sumWeights = 0;
        var sumX = 0;
        var sumXSquared = 0;
        var sumY = 0;
        var sumXY = 0;
        for (var k = iLeft; k <= iRight; ++k) {
            var xk = xVals[k];
            var yk = yVals[k];
            var dist = Math.abs(xk - x);
            var w1 = weights ? weights[k] : 1;
            var w2 = triCube(dist / maxDist);
            var w = w1 * w2;
            var xkw = xk * w;
            sumWeights += w;
            sumX += xkw;
            sumXSquared += xk * xkw;
            sumY += yk * w;
            sumXY += yk * xkw;
        }
        if (sumWeights < 1E-12) {
            return NaN;
        }
        var meanX = sumX / sumWeights;
        var meanY = sumY / sumWeights;
        var meanXY = sumXY / sumWeights;
        var meanXSquared = sumXSquared / sumWeights;
        var meanXSqrDiff = meanXSquared - meanX * meanX;
        var beta;
        if (Math.abs(meanXSqrDiff) < Math.pow(accuracy, 2)) {
            beta = 0;
        }
        else {
            beta = (meanXY - meanX * meanY) / meanXSqrDiff;
        }
        return meanY + beta * x - beta * meanX;
    }
    function findInitialBandwidthInterval(weights, bandwidthInPoints, n) {
        var iLeft = findNonZero(weights, 0);
        if (iLeft >= n) {
            throw new Error("Initial bandwidth start point not found.");
        }
        var iRight = iLeft;
        for (var i = 0; i < bandwidthInPoints - 1; i++) {
            iRight = findNonZero(weights, iRight + 1);
            if (iRight >= n) {
                throw new Error("Initial bandwidth end point not found.");
            }
        }
        return { iLeft: iLeft, iRight: iRight };
    }
    function moveBandwidthInterval(bw, x, xVals, weights) {
        var n = xVals.length;
        while (true) {
            var nextRight = findNonZero(weights, bw.iRight + 1);
            if (nextRight >= n || xVals[nextRight] - x >= x - xVals[bw.iLeft]) {
                return;
            }
            bw.iLeft = findNonZero(weights, bw.iLeft + 1);
            bw.iRight = nextRight;
        }
    }
    function calculateRobustnessWeights(residuals, outlierDistance) {
        var n = residuals.length;
        var robustnessWeights = new Float64Array(n);
        for (var i = 0; i < n; i++) {
            robustnessWeights[i] = biWeight(residuals[i] / outlierDistance);
        }
        return robustnessWeights;
    }
    function combineWeights(w1, w2) {
        if (!w1 || !w2) {
            return w1 || w2;
        }
        var n = w1.length;
        var a = new Float64Array(n);
        for (var i = 0; i < n; i++) {
            a[i] = w1[i] * w2[i];
        }
        return a;
    }
    function findNonZero(a, startPos) {
        if (!a) {
            return startPos;
        }
        var n = a.length;
        var i = startPos;
        while (i < n && a[i] == 0) {
            i++;
        }
        return i;
    }
    function countNonZeros(a) {
        var cnt = 0;
        for (var i = 0; i < a.length; i++) {
            if (a[i] != 0) {
                cnt++;
            }
        }
        return cnt;
    }
    function absDiff(a1, a2) {
        var n = a1.length;
        var a3 = new Float64Array(n);
        for (var i = 0; i < n; i++) {
            a3[i] = Math.abs(a1[i] - a2[i]);
        }
        return a3;
    }
    function triCube(x) {
        var absX = Math.abs(x);
        if (absX >= 1) {
            return 0;
        }
        var tmp = 1 - absX * absX * absX;
        return tmp * tmp * tmp;
    }
    function biWeight(x) {
        var absX = Math.abs(x);
        if (absX >= 1) {
            return 0;
        }
        var tmp = 1 - absX * absX;
        return tmp * tmp;
    }

    function createInterpolator(interpolationMethod, xVals, yVals) {
        switch (interpolationMethod) {
            case "akima": return createAkimaSplineInterpolator(xVals, yVals);
            case "cubic": return createCubicSplineInterpolator(xVals, yVals);
            case "linear": return createLinearInterpolator(xVals, yVals);
            case "nearestNeighbor": return createNearestNeighborInterpolator(xVals, yVals);
            case "loess": return createLoessInterpolator({ xVals: xVals, yVals: yVals });
            default: throw new Error("Unknown interpolation method \"" + interpolationMethod + "\".");
        }
    }
    function createInterpolatorWithFallback(interpolationMethod, xVals, yVals) {
        var n = xVals.length;
        var method = interpolationMethod;
        if (n < 5 && method == "akima") {
            method = "cubic";
        }
        if (n < 3 && method == "cubic") {
            method = "linear";
        }
        if (n < 2) {
            var c_1 = (n == 1) ? yVals[0] : 0;
            return function (_x) { return c_1; };
        }
        return createInterpolator(method, xVals, yVals);
    }

    class EventTargetPolyfill {
        constructor() {
            this.listenerMap = new Map();
        }
        addEventListener(type, listener) {
            let a = this.listenerMap.get(type);
            if (!a) {
                a = [];
                this.listenerMap.set(type, a);
            }
            else if (a.includes(listener)) {
                return;
            }
            a.push(listener);
        }
        removeEventListener(type, listener) {
            const a = this.listenerMap.get(type);
            if (!a) {
                return;
            }
            const i = a.indexOf(listener);
            if (i < 0) {
                return;
            }
            a.splice(i, 1);
        }
        dispatchEvent(event) {
            const a = this.listenerMap.get(event.type);
            if (!a) {
                return true;
            }
            const a2 = a.slice();
            for (const listener of a2) {
                listener(event);
            }
            return true;
        }
    }

    var __extends = (undefined && undefined.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var __assign = (undefined && undefined.__assign) || function () {
        __assign = Object.assign || function(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    var activeDialogType;
    var activeDialogParms;
    var dialogResult;
    var displayState;
    var oldActiveElement = null;
    var animationSupported;
    var initDone = false;
    var rootElement;
    var frameElement;
    var headerElement;
    var contentElement;
    var footerElement;
    var okButton;
    var cancelButton;
    var toastRootElement;
    var toastBoxElement;
    var FormInputProcessorException = (function (_super) {
        __extends(FormInputProcessorException, _super);
        function FormInputProcessorException() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.isFormInputProcessorException = true;
            return _this;
        }
        return FormInputProcessorException;
    }(Error));
    function init() {
        if (initDone) {
            return;
        }
        var styleElement = document.createElement("style");
        styleElement.textContent = cssTemplate;
        document.head.insertAdjacentElement("afterbegin", styleElement);
        document.body.insertAdjacentHTML("beforeend", htmlTemplate);
        rootElement = document.querySelector(".dialogMgr_root");
        frameElement = rootElement.querySelector(".dialogMgr_frame");
        headerElement = frameElement.querySelector(".dialogMgr_header");
        contentElement = frameElement.querySelector(".dialogMgr_content");
        footerElement = frameElement.querySelector(".dialogMgr_footer");
        okButton = frameElement.querySelector(".dialogMgr_okButton");
        cancelButton = frameElement.querySelector(".dialogMgr_cancelButton");
        toastRootElement = document.querySelector(".dialogMgr_toastRoot");
        toastBoxElement = toastRootElement.querySelector(".dialogMgr_toastBox");
        rootElement.addEventListener("animationend", animationEndEventHandler);
        rootElement.addEventListener("click", rootElementClickEventHandler);
        okButton.addEventListener("click", okButtonClickEventHandler);
        cancelButton.addEventListener("click", cancelButtonClickEventHandler);
        document.addEventListener("keydown", documentKeyDownEventHandler);
        toastRootElement.addEventListener("animationend", toastAnimationEndEventHandler);
        animationSupported = rootElement.style.animationName !== undefined;
        displayState = 0;
        initDone = true;
    }
    function setDisplayState(newDisplayState) {
        if (!initDone || displayState == newDisplayState) {
            return;
        }
        displayState = newDisplayState;
        setClass(rootElement, "dialogMgr_fadeIn", displayState == 1);
        setClass(rootElement, "dialogMgr_fadeOut", displayState == 2 && animationSupported);
        setClass(rootElement, "dialogMgr_transparentOverlay", displayState == 3);
    }
    function setWaitCursor(enabled) {
        setClass(rootElement, "dialogMgr_waitCursor", enabled);
    }
    function getAutoFocusElement() {
        var dp = activeDialogParms;
        return (!dp ? frameElement :
            dp.focusElement ? dp.focusElement :
                dp.cancelButton ? cancelButton :
                    dp.okButton ? okButton :
                        frameElement);
    }
    function restoreOldFocus() {
        if (!oldActiveElement) {
            return;
        }
        try {
            oldActiveElement.focus();
        }
        catch (e) {
            console.log("Unable to restore old focus. " + e);
        }
    }
    function closeDialog(fade) {
        if (fade === void 0) { fade = false; }
        if (!initDone || activeDialogType == undefined) {
            return;
        }
        activeDialogType = undefined;
        setDisplayState(fade ? 2 : 0);
        stopFocusJail();
        restoreOldFocus();
        if (activeDialogParms && activeDialogParms.onClose) {
            activeDialogParms.onClose(dialogResult);
        }
    }
    function updateDialog(dp) {
        headerElement.style.display = (dp.titleText) ? "" : "none";
        headerElement.textContent = dp.titleText || "";
        contentElement.innerHTML = "";
        contentElement.appendChild(dp.content);
        nextTick(function () {
            contentElement.scrollTop = 0;
            contentElement.scrollLeft = 0;
        });
        setClass(frameElement, "dialogMgr_wide", !!dp.wide);
        footerElement.style.display = (dp.okButton || dp.cancelButton) ? "" : "none";
        okButton.style.display = dp.okButton ? "" : "none";
        cancelButton.style.display = dp.cancelButton ? "" : "none";
    }
    function openModalDialog(dp) {
        init();
        closeDialog();
        updateDialog(dp);
        cancelDelayedDisplayTimer();
        activeDialogType = dp.dialogType;
        activeDialogParms = dp;
        dialogResult = dp.defaultDialogResult;
        setDisplayState(1);
        setWaitCursor(dp.dialogType == 1);
        oldActiveElement = document.activeElement;
        getAutoFocusElement().focus();
        startFocusJail();
    }
    function animationEndEventHandler() {
        if (displayState == 2) {
            setDisplayState(0);
        }
    }
    function rootElementClickEventHandler(event) {
        if (event.target == rootElement && activeDialogType != undefined && activeDialogParms && activeDialogParms.closeEnabled) {
            closeDialog();
        }
    }
    function okButtonClickEventHandler() {
        if (activeDialogParms && activeDialogParms.formInputProcessor) {
            try {
                dialogResult = activeDialogParms.formInputProcessor();
            }
            catch (e) {
                if (!e.isFormInputProcessorException) {
                    alert("Error in formInputProcessor: " + e);
                }
                return;
            }
        }
        else {
            dialogResult = true;
        }
        closeDialog();
    }
    function cancelButtonClickEventHandler() {
        closeDialog();
    }
    function documentKeyDownEventHandler(event) {
        if (activeDialogType != undefined) {
            if ((event.key == "Escape" || event.key == "Esc") && activeDialogParms && activeDialogParms.closeEnabled) {
                event.preventDefault();
                closeDialog();
            }
        }
        if (displayState == 3) {
            event.preventDefault();
        }
    }
    function startFocusJail() {
        stopFocusJail();
        document.addEventListener("focusin", documentFocusInEventHandler);
    }
    function stopFocusJail() {
        document.removeEventListener("focusin", documentFocusInEventHandler);
    }
    function documentFocusInEventHandler(event) {
        var t = event.target;
        if (t instanceof Element && !rootElement.contains(t)) {
            getAutoFocusElement().focus();
        }
    }
    var delayedDisplayTimerId;
    function cancelDelayedDisplayTimer() {
        if (delayedDisplayTimerId) {
            clearTimeout(delayedDisplayTimerId);
            delayedDisplayTimerId = undefined;
        }
    }
    function createFragment(html) {
        return document.createRange().createContextualFragment(html);
    }
    function genContentTextElement(msgText) {
        var e = document.createElement("div");
        e.className = "dialogMgr_contentTextPreWrap";
        e.textContent = msgText;
        return e;
    }
    function genContentFrameElement(contentNode) {
        var e = document.createElement("div");
        e.className = "dialogMgr_contentPadding";
        e.appendChild(contentNode);
        return e;
    }
    function getDialogParmsFromMsgParms(mp) {
        return {
            dialogType: 0,
            titleText: mp.titleText,
            content: mp.msgText ? genContentTextElement(mp.msgText) :
                mp.msgHtml ? genContentFrameElement(createFragment(mp.msgHtml)) :
                    mp.msgNode ? genContentFrameElement(mp.msgNode) :
                        genContentTextElement("(no text)"),
            wide: (mp.wide != undefined) ? mp.wide :
                mp.msgText ? mp.msgText.length > 500 :
                    mp.msgHtml ? mp.msgHtml.length > 800 :
                        false
        };
    }
    function showMsg(mp) {
        return new Promise(executor);
        function executor(resolve, _reject) {
            var dp = __assign(__assign({}, getDialogParmsFromMsgParms(mp)), { closeEnabled: true, okButton: true, onClose: resolve });
            openModalDialog(dp);
        }
    }
    function promptInput(pp) {
        return new Promise(executor);
        function executor(resolve, _reject) {
            var _a;
            var multiline = pp.rows && pp.rows > 1;
            var template1 = multiline ?
                "<textarea required rows=\"" + pp.rows + "\" style=\"width: 100%\">" :
                "<input type=\"text\" required style=\"width: 100%\">";
            var template = "\n         <form class=\"dialogMgr_contentPadding\">\n          <div class=\"dialogMgr_promptText\"></div>\n          <div style=\"margin-top: 10px;\">\n           " + template1 + "\n          </div>\n         </form>";
            var fragment = createFragment(template);
            fragment.querySelector(".dialogMgr_promptText").textContent = pp.promptText;
            var formElement = fragment.querySelector("form");
            var inputElement = multiline ?
                fragment.querySelector("textarea") :
                fragment.querySelector("input");
            inputElement.value = (_a = pp.defaultValue, (_a !== null && _a !== void 0 ? _a : ""));
            formElement.addEventListener("submit", formSubmitEventListener);
            inputElement.addEventListener("blur", trimInput);
            var reportValidityActive = false;
            function formSubmitEventListener(event) {
                trimInput();
                if (reportValidityActive) {
                    return;
                }
                event.preventDefault();
                okButton.click();
            }
            function trimInput() {
                inputElement.value = inputElement.value.trim();
            }
            function formInputProcessor() {
                reportValidityActive = true;
                var isValid = formElement.reportValidity();
                reportValidityActive = false;
                if (!isValid) {
                    throw new FormInputProcessorException();
                }
                return inputElement.value.trim();
            }
            var dp = {
                dialogType: 0,
                content: fragment,
                titleText: pp.titleText,
                closeEnabled: true,
                okButton: true,
                cancelButton: true,
                focusElement: inputElement,
                formInputProcessor: formInputProcessor,
                onClose: resolve
            };
            openModalDialog(dp);
        }
    }
    var toastDisplayState;
    function setToastDisplayState(newDisplayState) {
        setClass(toastRootElement, "dialogMgr_fadeIn", newDisplayState == 1);
        setClass(toastRootElement, "dialogMgr_fadeOut", newDisplayState == 2 && animationSupported);
        toastDisplayState = newDisplayState;
    }
    function toastAnimationEndEventHandler() {
        if (toastDisplayState == 2) {
            setToastDisplayState(0);
        }
    }
    var cssTemplate = "\n @keyframes dialogMgr_fadeIn {\n    from { opacity: 0; }\n      to { opacity: 1; }}\n @keyframes dialogMgr_fadeOut {\n    from { opacity: 1; }\n      to { opacity: 0; }}\n .dialogMgr_root {\n    display: none;\n    flex-direction: column;\n    justify-content: center;\n    align-items: center;\n    position: fixed;\n    top: 0;\n    right: 0;\n    bottom: 0;\n    left: 0;\n    overflow: hidden;\n    font-size: 1rem;\n    background-color: rgba(64, 64, 64, 0.5);\n    box-sizing: border-box;\n    z-index: 990; }\n .dialogMgr_root.dialogMgr_fadeIn {\n    display: flex;\n    animation: dialogMgr_fadeIn 150ms ease-in forwards; }\n .dialogMgr_root.dialogMgr_fadeOut {\n    display: flex;\n    animation: dialogMgr_fadeOut 190ms ease-in forwards; }\n .dialogMgr_root.dialogMgr_transparentOverlay {\n    display: flex;\n    background-color: transparent; }\n .dialogMgr_root.dialogMgr_transparentOverlay > * {\n    display: none; }\n .dialogMgr_upperFiller {\n    flex-grow: 2;\n    visibility: hidden; }\n .dialogMgr_lowerFiller {\n    flex-grow: 3;\n    visibility: hidden; }\n .dialogMgr_frame {\n    position: relative;\n    width: 500px;\n    background-color: #fff;\n    border-radius: 4px;\n    outline: none; }\n .dialogMgr_frame.dialogMgr_wide {\n    width: 800px; }\n .dialogMgr_header {\n    font-size: 1.2rem;\n    line-height: 1.125;\n    font-weight: bold;\n    padding: 18px 21px;\n    border-bottom: 1px solid #ddd; }\n .dialogMgr_content {\n    max-height: calc(100vh - 180px);\n    overflow: auto; }\n .dialogMgr_contentPadding {\n    padding: 21px; }\n .dialogMgr_contentTextPreWrap {\n    padding: 21px;\n    white-space: pre-wrap; }\n .dialogMgr_footer {\n    display: flex;\n    justify-content: flex-end;\n    border-top: 1px solid #ddd;\n    background: #fcfcfc;\n    border-bottom-left-radius: 4px;\n    border-bottom-right-radius: 4px;\n    padding: 14px; }\n .dialogMgr_footer button {\n    min-width: 70px;\n    margin-left: 14px; }\n .dialogMgr_waitCursor {\n    cursor: wait; }\n\n .dialogMgr_toastRoot {\n    display: none;\n    visibility: hidden;\n    position: fixed;\n    box-sizing: border-box;\n    left: 0;\n    right: 0;\n    bottom: 30px;\n    z-index: 991; }\n .dialogMgr_toastRoot.dialogMgr_fadeIn {\n    display: flex;\n    animation: dialogMgr_fadeIn 150ms ease-in forwards; }\n .dialogMgr_toastRoot.dialogMgr_fadeOut {\n    display: flex;\n    animation: dialogMgr_fadeOut 190ms ease-in forwards; }\n .dialogMgr_toastBox {\n    visibility: visible;\n    bottom: 0;\n    max-width: 400px;\n    padding: 15px;\n    margin: 0 auto;\n    font-size: 1rem;\n    color: #fff;\n    background-color: #555;\n    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);\n    border-radius: 6px; }";
    var htmlTemplate = "\n <div class=\"dialogMgr_root\">\n  <div class=\"dialogMgr_upperFiller\"></div>\n  <div class=\"dialogMgr_frame\" tabindex=\"-1\">\n   <div class=\"dialogMgr_header\"></div>\n   <div class=\"dialogMgr_content\"></div>\n   <div class=\"dialogMgr_footer\">\n    <button class=\"dialogMgr_okButton primary\">\n     OK\n    </button>\n    <button class=\"dialogMgr_cancelButton\">\n     Cancel\n    </button>\n   </div>\n  </div>\n  <div class=\"dialogMgr_lowerFiller\"></div>\n </div>\n\n <div class=\"dialogMgr_toastRoot\">\n  <div class=\"dialogMgr_toastBox\"></div>\n </div>";
    function setClass(element, cssClassName, enabled) {
        var cl = element.classList;
        if (enabled) {
            cl.add(cssClassName);
        }
        else {
            cl.remove(cssClassName);
        }
    }
    var dummyResolvedPromise;
    function nextTick(callback) {
        if (!dummyResolvedPromise) {
            dummyResolvedPromise = Promise.resolve();
        }
        void dummyResolvedPromise.then(callback);
    }

    class PointUtils {
        static clone(p) {
            return { x: p.x, y: p.y };
        }
        static computeDistance(point1, point2) {
            const dx = point1.x - point2.x;
            const dy = point1.y - point2.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
        static computeCenter(point1, point2) {
            return { x: (point1.x + point2.x) / 2, y: (point1.y + point2.y) / 2 };
        }
        static mapPointIndex(points1, points2, pointIndex) {
            if (pointIndex == undefined) {
                return;
            }
            const point = points1[pointIndex];
            return PointUtils.findPoint(points2, point);
        }
        static findPoint(points, point) {
            if (!point) {
                return;
            }
            const i = points.indexOf(point);
            return (i >= 0) ? i : undefined;
        }
        static makeXValsStrictMonotonic(points) {
            for (let i = 1; i < points.length; i++) {
                if (points[i].x <= points[i - 1].x) {
                    points[i].x = points[i - 1].x + 1E-6;
                }
            }
        }
        static dumpPoints(points) {
            for (let i = 0; i < points.length; i++) {
                console.log("[" + i + "] = (" + points[i].x + ", " + points[i].y + ")");
            }
        }
        static encodeCoordinateList(points) {
            let s = "";
            for (const point of points) {
                if (s.length > 0) {
                    s += ", ";
                }
                s += "[" + point.x + ", " + point.y + "]";
            }
            return s;
        }
        static decodeCoordinateList(s) {
            const a = JSON.parse("[" + s + "]");
            const points = Array(a.length);
            for (let i = 0; i < a.length; i++) {
                const e = a[i];
                if (!Array.isArray(e) || e.length != 2 || typeof e[0] != "number" || typeof e[1] != "number") {
                    throw new Error("Invalid syntax in element " + i + ".");
                }
                points[i] = { x: e[0], y: e[1] };
            }
            return points;
        }
    }
    class FunctionPlotter {
        constructor(wctx) {
            this.wctx = wctx;
            const ctx = wctx.canvas.getContext("2d");
            if (!ctx) {
                throw new Error("Canvas 2D context not available.");
            }
            this.ctx = ctx;
        }
        clearCanvas() {
            const wctx = this.wctx;
            const ctx = this.ctx;
            ctx.save();
            const width = wctx.canvas.width;
            const height = wctx.canvas.height;
            const xMin = (wctx.eState.relevantXMin != undefined) ? Math.max(0, Math.min(width, wctx.mapLogicalToCanvasXCoordinate(wctx.eState.relevantXMin))) : 0;
            const xMax = (wctx.eState.relevantXMax != undefined) ? Math.max(xMin, Math.min(width, wctx.mapLogicalToCanvasXCoordinate(wctx.eState.relevantXMax))) : width;
            if (xMin > 0) {
                ctx.fillStyle = "#F8F8F8";
                ctx.fillRect(0, 0, xMin, height);
            }
            if (xMax > xMin) {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(xMin, 0, xMax - xMin, height);
            }
            if (xMax < width) {
                ctx.fillStyle = "#F8F8F8";
                ctx.fillRect(xMax, 0, width - xMax, height);
            }
            ctx.restore();
        }
        drawKnot(knotNdx) {
            const wctx = this.wctx;
            const ctx = this.ctx;
            const knot = wctx.eState.knots[knotNdx];
            const point = wctx.mapLogicalToCanvasCoordinates(knot);
            ctx.save();
            ctx.beginPath();
            const isDragging = knotNdx == wctx.iState.selectedKnotNdx && wctx.iState.knotDragging;
            const isSelected = knotNdx == wctx.iState.selectedKnotNdx;
            const isPotential = knotNdx == wctx.iState.potentialKnotNdx;
            const bold = isDragging || isSelected || isPotential;
            const r = bold ? 5 : 4;
            ctx.arc(point.x, point.y, r, 0, 2 * Math.PI);
            ctx.lineWidth = bold ? 3 : 1;
            ctx.strokeStyle = (isDragging || isPotential) ? "#EE5500" : isSelected ? "#0080FF" : "#CC4444";
            ctx.stroke();
            ctx.restore();
        }
        drawKnots() {
            const knots = this.wctx.eState.knots;
            for (let knotNdx = 0; knotNdx < knots.length; knotNdx++) {
                this.drawKnot(knotNdx);
            }
        }
        formatLabel(value, decPow) {
            let s = (decPow <= 7 && decPow >= -6) ? value.toFixed(Math.max(0, -decPow)) : value.toExponential();
            if (s.length > 10) {
                s = value.toPrecision(6);
            }
            return s;
        }
        drawLabel(cPos, value, decPow, xy) {
            const wctx = this.wctx;
            const ctx = this.ctx;
            ctx.save();
            ctx.textBaseline = "bottom";
            ctx.font = "12px";
            ctx.fillStyle = "#707070";
            const x = xy ? cPos + 5 : 5;
            const y = xy ? wctx.canvas.height - 2 : cPos - 2;
            const s = this.formatLabel(value, decPow);
            ctx.fillText(s, x, y);
            ctx.restore();
        }
        drawGridLine(p, cPos, xy) {
            const wctx = this.wctx;
            const ctx = this.ctx;
            ctx.save();
            ctx.fillStyle = (p == 0) ? "#989898" : (p % 10 == 0) ? "#D4D4D4" : "#EEEEEE";
            ctx.fillRect(xy ? cPos : 0, xy ? 0 : cPos, xy ? 1 : wctx.canvas.width, xy ? wctx.canvas.height : 1);
            ctx.restore();
        }
        drawXYGrid(xy) {
            const wctx = this.wctx;
            const gp = wctx.getGridParms(xy);
            if (!gp) {
                return;
            }
            let p = gp.pos;
            let loopCtr = 0;
            while (true) {
                const lPos = p * gp.space;
                const cPos = xy ? wctx.mapLogicalToCanvasXCoordinate(lPos) : wctx.mapLogicalToCanvasYCoordinate(lPos);
                if (xy ? (cPos > wctx.canvas.width) : (cPos < 0)) {
                    break;
                }
                this.drawGridLine(p, cPos, xy);
                this.drawLabel(cPos, lPos, gp.decPow, xy);
                p += gp.span;
                if (loopCtr++ > 100) {
                    break;
                }
            }
        }
        drawGrid() {
            this.drawXYGrid(true);
            this.drawXYGrid(false);
        }
        drawFunctionCurve(uniFunction, lxMin, lxMax) {
            const wctx = this.wctx;
            const ctx = this.ctx;
            ctx.save();
            ctx.beginPath();
            const cxMin = Math.max(0, Math.ceil(wctx.mapLogicalToCanvasXCoordinate(lxMin)));
            const cxMax = Math.min(wctx.canvas.width, Math.floor(wctx.mapLogicalToCanvasXCoordinate(lxMax)));
            for (let cx = cxMin; cx <= cxMax; cx++) {
                const lx = wctx.mapCanvasToLogicalXCoordinate(cx);
                const ly = uniFunction(lx);
                const cy = Math.max(-1E6, Math.min(1E6, wctx.mapLogicalToCanvasYCoordinate(ly)));
                ctx.lineTo(cx, cy);
            }
            ctx.strokeStyle = "#44CC44";
            ctx.stroke();
            ctx.restore();
        }
        drawFunctionCurveFromKnots() {
            const wctx = this.wctx;
            const knots = wctx.eState.knots;
            if (knots.length < 2 && !wctx.eState.extendedDomain) {
                return;
            }
            const xMin = wctx.eState.extendedDomain ? -1E99 : knots[0].x;
            const xMax = wctx.eState.extendedDomain ? 1E99 : knots[knots.length - 1].x;
            const uniFunction = wctx.createInterpolationFunction();
            this.drawFunctionCurve(uniFunction, xMin, xMax);
        }
        paint() {
            const wctx = this.wctx;
            this.clearCanvas();
            if (wctx.eState.gridEnabled) {
                this.drawGrid();
            }
            this.drawFunctionCurveFromKnots();
            this.drawKnots();
        }
    }
    class PointerController {
        constructor(wctx) {
            this.zooming = false;
            this.pointerDownEventListener = (event) => {
                if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || (event.pointerType == "mouse" && event.button != 0)) {
                    return;
                }
                this.trackPointer(event);
                if ((event.pointerType == "touch" || event.pointerType == "pen") && this.pointers.size == 1) {
                    if (this.lastTouchTime > 0 && performance.now() - this.lastTouchTime <= 300) {
                        this.lastTouchTime = 0;
                        this.processDoubleClickTouch();
                        event.preventDefault();
                        return;
                    }
                    this.lastTouchTime = performance.now();
                }
                this.switchMode();
                event.preventDefault();
            };
            this.pointerUpEventListener = (event) => {
                this.releasePointer(event.pointerId);
                this.switchMode();
                event.preventDefault();
            };
            this.pointerMoveEventListener = (event) => {
                if (!this.pointers.has(event.pointerId)) {
                    this.updatePotentialKnot(event);
                    return;
                }
                this.trackPointer(event);
                if (this.pointers.size == 1) {
                    this.drag();
                }
                else if (this.pointers.size == 2 && this.zooming) {
                    this.zoom();
                }
                event.preventDefault();
            };
            this.wheelEventListener = (event) => {
                const wctx = this.wctx;
                const cPoint = this.getCanvasCoordinatesFromEvent(event);
                if (event.deltaY == 0) {
                    return;
                }
                const f = (event.deltaY > 0) ? Math.SQRT1_2 : Math.SQRT2;
                let zoomMode;
                if (event.shiftKey) {
                    zoomMode = 1;
                }
                else if (event.altKey) {
                    zoomMode = 0;
                }
                else if (event.ctrlKey) {
                    zoomMode = 2;
                }
                else {
                    zoomMode = wctx.eState.primaryZoomMode;
                }
                let fx;
                let fy;
                switch (zoomMode) {
                    case 0: {
                        fx = f;
                        fy = 1;
                        break;
                    }
                    case 1: {
                        fx = 1;
                        fy = f;
                        break;
                    }
                    default: {
                        fx = f;
                        fy = f;
                    }
                }
                wctx.zoom(fx, fy, cPoint);
                wctx.requestRefresh();
                event.preventDefault();
            };
            this.dblClickEventListener = (event) => {
                if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.button != 0) {
                    return;
                }
                const cPoint = this.getCanvasCoordinatesFromEvent(event);
                this.createKnot(cPoint);
                event.preventDefault();
            };
            this.wctx = wctx;
            this.pointers = new Map();
            wctx.canvas.addEventListener("pointerdown", this.pointerDownEventListener);
            wctx.canvas.addEventListener("pointerup", this.pointerUpEventListener);
            wctx.canvas.addEventListener("pointercancel", this.pointerUpEventListener);
            wctx.canvas.addEventListener("pointermove", this.pointerMoveEventListener);
            wctx.canvas.addEventListener("dblclick", this.dblClickEventListener);
            wctx.canvas.addEventListener("wheel", this.wheelEventListener);
        }
        dispose() {
            const wctx = this.wctx;
            wctx.canvas.removeEventListener("pointerdown", this.pointerDownEventListener);
            wctx.canvas.removeEventListener("pointerup", this.pointerUpEventListener);
            wctx.canvas.removeEventListener("pointercancel", this.pointerUpEventListener);
            wctx.canvas.removeEventListener("pointermove", this.pointerMoveEventListener);
            wctx.canvas.removeEventListener("dblclick", this.dblClickEventListener);
            wctx.canvas.removeEventListener("wheel", this.wheelEventListener);
            this.releaseAllPointers();
        }
        processEscKey() {
            this.abortDragging();
        }
        switchMode() {
            const wctx = this.wctx;
            this.stopDragging();
            this.stopZooming();
            if (this.pointers.size == 1) {
                this.startDragging();
                wctx.canvas.focus();
            }
            else if (this.pointers.size == 2) {
                this.startZooming();
            }
        }
        trackPointer(event) {
            const wctx = this.wctx;
            const pointerId = event.pointerId;
            if (!this.pointers.has(pointerId)) {
                wctx.canvas.setPointerCapture(pointerId);
            }
            this.pointers.set(pointerId, event);
        }
        releasePointer(pointerId) {
            const wctx = this.wctx;
            this.pointers.delete(pointerId);
            wctx.canvas.releasePointerCapture(pointerId);
        }
        releaseAllPointers() {
            while (this.pointers.size > 0) {
                const pointerId = this.pointers.keys().next().value;
                this.releasePointer(pointerId);
            }
        }
        startDragging() {
            const wctx = this.wctx;
            const cPoint = this.getCanvasCoordinates();
            const lPoint = wctx.mapCanvasToLogicalCoordinates(cPoint);
            const pointerType = this.pointers.values().next().value.pointerType;
            const knotNdx = this.findNearKnot(cPoint, pointerType);
            wctx.iState.selectedKnotNdx = knotNdx;
            wctx.iState.knotDragging = knotNdx != undefined;
            wctx.iState.planeDragging = knotNdx == undefined;
            this.dragStartLPos = lPoint;
            this.dragStartCPos = cPoint;
            this.dragCount = 0;
            wctx.iState.potentialKnotNdx = undefined;
            wctx.requestRefresh();
        }
        abortDragging() {
            const wctx = this.wctx;
            if (wctx.iState.knotDragging && this.dragCount > 0) {
                wctx.undo();
                wctx.fireChangeEvent();
            }
            if (wctx.iState.planeDragging && this.dragStartCPos && this.dragStartLPos) {
                wctx.moveCoordinatePlane(this.dragStartCPos, this.dragStartLPos);
            }
            this.stopDragging();
            wctx.requestRefresh();
        }
        stopDragging() {
            const wctx = this.wctx;
            if (wctx.iState.knotDragging || wctx.iState.planeDragging) {
                wctx.requestRefresh();
            }
            this.dragStartLPos = undefined;
            this.dragStartCPos = undefined;
            wctx.iState.knotDragging = false;
            wctx.iState.planeDragging = false;
        }
        drag() {
            const wctx = this.wctx;
            const cPoint = this.getCanvasCoordinates();
            if (wctx.iState.knotDragging && wctx.iState.selectedKnotNdx != undefined) {
                if (this.dragCount++ == 0) {
                    wctx.pushUndoHistoryState();
                }
                const lPoint = wctx.mapCanvasToLogicalCoordinates(cPoint);
                const lPoint2 = this.snapToGrid(lPoint);
                wctx.moveKnot(wctx.iState.selectedKnotNdx, lPoint2);
                wctx.requestRefresh();
                wctx.fireChangeEvent();
            }
            else if (wctx.iState.planeDragging && this.dragStartLPos) {
                wctx.moveCoordinatePlane(cPoint, this.dragStartLPos);
                wctx.requestRefresh();
            }
        }
        startZooming() {
            const wctx = this.wctx;
            const pointerValues = this.pointers.values();
            const event1 = pointerValues.next().value;
            const event2 = pointerValues.next().value;
            const cPoint1 = this.getCanvasCoordinatesFromEvent(event1);
            const cPoint2 = this.getCanvasCoordinatesFromEvent(event2);
            const cCenter = PointUtils.computeCenter(cPoint1, cPoint2);
            const xDist = Math.abs(cPoint1.x - cPoint2.x);
            const yDist = Math.abs(cPoint1.y - cPoint2.y);
            this.zoomLCenter = wctx.mapCanvasToLogicalCoordinates(cCenter);
            this.zoomStartDist = PointUtils.computeDistance(cPoint1, cPoint2);
            this.zoomStartFactorX = wctx.getZoomFactor(true);
            this.zoomStartFactorY = wctx.getZoomFactor(false);
            const t = Math.tan(Math.PI / 8);
            this.zoomX = xDist > t * yDist;
            this.zoomY = yDist > t * xDist;
            this.zooming = true;
        }
        stopZooming() {
            this.zooming = false;
        }
        zoom() {
            const wctx = this.wctx;
            const eState = wctx.eState;
            const pointerValues = this.pointers.values();
            const event1 = pointerValues.next().value;
            const event2 = pointerValues.next().value;
            const cPoint1 = this.getCanvasCoordinatesFromEvent(event1);
            const cPoint2 = this.getCanvasCoordinatesFromEvent(event2);
            const newCCenter = PointUtils.computeCenter(cPoint1, cPoint2);
            const newDist = PointUtils.computeDistance(cPoint1, cPoint2);
            const f = newDist / this.zoomStartDist;
            if (this.zoomX) {
                eState.xMax = eState.xMin + wctx.canvas.width / (this.zoomStartFactorX * f);
            }
            if (this.zoomY) {
                eState.yMax = eState.yMin + wctx.canvas.height / (this.zoomStartFactorY * f);
            }
            wctx.moveCoordinatePlane(newCCenter, this.zoomLCenter);
            wctx.requestRefresh();
        }
        processDoubleClickTouch() {
            const cPoint = this.getCanvasCoordinates();
            this.createKnot(cPoint);
        }
        createKnot(cPoint) {
            const wctx = this.wctx;
            wctx.pushUndoHistoryState();
            const lPoint = wctx.mapCanvasToLogicalCoordinates(cPoint);
            const knotNdx = wctx.addKnot(lPoint);
            wctx.iState.selectedKnotNdx = knotNdx;
            wctx.iState.potentialKnotNdx = knotNdx;
            wctx.iState.knotDragging = false;
            wctx.iState.planeDragging = false;
            wctx.requestRefresh();
            wctx.fireChangeEvent();
        }
        updatePotentialKnot(event) {
            const wctx = this.wctx;
            const cPoint = this.getCanvasCoordinatesFromEvent(event);
            const knotNdx = this.findNearKnot(cPoint, event.pointerType);
            if (wctx.iState.potentialKnotNdx != knotNdx) {
                wctx.iState.potentialKnotNdx = knotNdx;
                wctx.requestRefresh();
            }
        }
        findNearKnot(cPoint, pointerType) {
            const wctx = this.wctx;
            const r = wctx.findNearestKnot(cPoint);
            const proximityRange = (pointerType == "touch") ? 30 : 15;
            return (r && r.distance <= proximityRange) ? r.knotNdx : undefined;
        }
        snapToGrid(lPoint) {
            const wctx = this.wctx;
            if (!wctx.eState.gridEnabled || !wctx.eState.snapToGridEnabled) {
                return lPoint;
            }
            return { x: this.snapToGrid2(lPoint.x, true), y: this.snapToGrid2(lPoint.y, false) };
        }
        snapToGrid2(lPos, xy) {
            const maxDistance = 5;
            const wctx = this.wctx;
            const gp = wctx.getGridParms(xy);
            if (!gp) {
                return lPos;
            }
            const gridSpace = gp.space * gp.span;
            const gridPos = Math.round(lPos / gridSpace) * gridSpace;
            const lDist = Math.abs(lPos - gridPos);
            const cDist = lDist * wctx.getZoomFactor(xy);
            if (cDist > maxDistance) {
                return lPos;
            }
            return gridPos;
        }
        getCanvasCoordinates() {
            if (this.pointers.size < 1) {
                throw new Error("No active pointers.");
            }
            const event = this.pointers.values().next().value;
            return this.getCanvasCoordinatesFromEvent(event);
        }
        getCanvasCoordinatesFromEvent(event) {
            const wctx = this.wctx;
            return wctx.mapViewportToCanvasCoordinates({ x: event.clientX, y: event.clientY });
        }
    }
    class KeyboardController {
        constructor(wctx) {
            this.keyDownEventListener = (event) => {
                const keyName = genKeyName(event);
                if (this.processKeyDown(keyName)) {
                    event.preventDefault();
                }
            };
            this.keyPressEventListener = (event) => {
                const keyName = genKeyName(event);
                if (this.processKeyPress(keyName)) {
                    event.preventDefault();
                }
            };
            this.wctx = wctx;
            wctx.canvas.addEventListener("keydown", this.keyDownEventListener);
            wctx.canvas.addEventListener("keypress", this.keyPressEventListener);
        }
        dispose() {
            const wctx = this.wctx;
            wctx.canvas.removeEventListener("keydown", this.keyDownEventListener);
            wctx.canvas.removeEventListener("keypress", this.keyPressEventListener);
        }
        processKeyDown(keyName) {
            const wctx = this.wctx;
            switch (keyName) {
                case "Backspace":
                case "Delete": {
                    if (wctx.iState.selectedKnotNdx != undefined) {
                        wctx.iState.knotDragging = false;
                        wctx.pushUndoHistoryState();
                        wctx.deleteKnot(wctx.iState.selectedKnotNdx);
                        wctx.requestRefresh();
                        wctx.fireChangeEvent();
                    }
                    return true;
                }
                case "Ctrl+z":
                case "Alt+Backspace": {
                    if (wctx.undo()) {
                        wctx.requestRefresh();
                        wctx.fireChangeEvent();
                    }
                    return true;
                }
                case "Ctrl+y":
                case "Ctrl+Z": {
                    if (wctx.redo()) {
                        wctx.requestRefresh();
                        wctx.fireChangeEvent();
                    }
                    return true;
                }
                case "Escape": {
                    wctx.pointerController.processEscKey();
                    return true;
                }
                default: {
                    return false;
                }
            }
        }
        processKeyPress(keyName) {
            const wctx = this.wctx;
            const eState = wctx.eState;
            switch (keyName) {
                case "+":
                case "-":
                case "x":
                case "X":
                case "y":
                case "Y": {
                    const fx = (keyName == '+' || keyName == 'X') ? Math.SQRT2 : (keyName == '-' || keyName == 'x') ? Math.SQRT1_2 : 1;
                    const fy = (keyName == '+' || keyName == 'Y') ? Math.SQRT2 : (keyName == '-' || keyName == 'y') ? Math.SQRT1_2 : 1;
                    wctx.zoom(fx, fy);
                    wctx.requestRefresh();
                    return true;
                }
                case "i": {
                    wctx.reset();
                    wctx.requestRefresh();
                    wctx.fireChangeEvent();
                    return true;
                }
                case "c": {
                    wctx.pushUndoHistoryState();
                    wctx.clearKnots();
                    wctx.requestRefresh();
                    wctx.fireChangeEvent();
                    return true;
                }
                case "e": {
                    eState.extendedDomain = !eState.extendedDomain;
                    wctx.requestRefresh();
                    return true;
                }
                case "g": {
                    eState.gridEnabled = !eState.gridEnabled;
                    wctx.requestRefresh();
                    return true;
                }
                case "s": {
                    eState.snapToGridEnabled = !eState.snapToGridEnabled;
                    return true;
                }
                case "l": {
                    eState.interpolationMethod = (eState.interpolationMethod == "linear") ? "akima" : "linear";
                    wctx.requestRefresh();
                    wctx.fireChangeEvent();
                    return true;
                }
                case "k": {
                    void this.promptKnots();
                    return true;
                }
                case "r": {
                    void this.resample1();
                    return true;
                }
                default: {
                    return false;
                }
            }
        }
        async promptKnots() {
            const wctx = this.wctx;
            const eState = wctx.eState;
            const s1 = PointUtils.encodeCoordinateList(eState.knots);
            const s2 = await promptInput({ promptText: "Knot coordinates:", defaultValue: s1, rows: 5 });
            if (!s2 || s1 == s2) {
                return;
            }
            let newKnots;
            try {
                newKnots = PointUtils.decodeCoordinateList(s2);
            }
            catch (e) {
                await showMsg({ titleText: "Error", msgText: "Input could not be decoded. " + e });
                return;
            }
            wctx.pushUndoHistoryState();
            wctx.replaceKnots(newKnots);
            wctx.requestRefresh();
            wctx.fireChangeEvent();
        }
        async resample1() {
            const n = await this.promptResampleCount();
            if (!n) {
                return;
            }
            this.resample2(n);
        }
        resample2(n) {
            const wctx = this.wctx;
            const oldKnots = wctx.eState.knots;
            if (oldKnots.length < 1) {
                void showMsg({ msgText: "No knots." });
                return;
            }
            const xMin = oldKnots[0].x;
            const xMax = oldKnots[oldKnots.length - 1].x;
            const uniFunction = wctx.createInterpolationFunction();
            const newKnots = Array(n);
            for (let i = 0; i < n; i++) {
                const x = xMin + (xMax - xMin) / (n - 1) * i;
                const y = uniFunction(x);
                newKnots[i] = { x, y };
            }
            wctx.pushUndoHistoryState();
            wctx.replaceKnots(newKnots);
            wctx.requestRefresh();
            wctx.fireChangeEvent();
        }
        async promptResampleCount() {
            const wctx = this.wctx;
            const oldN = wctx.eState.knots.length;
            const s = await promptInput({ titleText: "Re-sample", promptText: "Number of knots:", defaultValue: String(oldN) });
            if (!s) {
                return;
            }
            const n = Number(s);
            if (!Number.isInteger(n) || n < 2 || n > 1E7) {
                await showMsg({ titleText: "Error", msgText: "Invalid number: " + s });
                return;
            }
            return n;
        }
    }
    function genKeyName(event) {
        const s = (event.altKey ? "Alt+" : "") +
            (event.ctrlKey ? "Ctrl+" : "") +
            (event.shiftKey && event.key.length > 1 ? "Shift+" : "") +
            (event.metaKey ? "Meta+" : "") +
            event.key;
        return s;
    }
    class WidgetContext {
        constructor(canvas) {
            this.animationFrameHandler = () => {
                this.animationFramePending = false;
                if (!this.isConnected) {
                    return;
                }
                this.refresh();
            };
            this.canvas = canvas;
            this.eventTarget = new EventTargetPolyfill();
            this.isConnected = false;
            this.animationFramePending = false;
            this.setEditorState({});
        }
        setConnected(connected) {
            if (connected == this.isConnected) {
                return;
            }
            if (connected) {
                this.plotter = new FunctionPlotter(this);
                this.pointerController = new PointerController(this);
                this.kbController = new KeyboardController(this);
            }
            else {
                this.pointerController.dispose();
                this.kbController.dispose();
            }
            this.isConnected = connected;
            this.requestRefresh();
        }
        adjustBackingBitmapResolution() {
            this.canvas.width = this.canvas.clientWidth || 200;
            this.canvas.height = this.canvas.clientHeight || 200;
        }
        setEditorState(eState) {
            this.eState = cloneEditorState(eState);
            this.initialEState = cloneEditorState(eState);
            this.resetInteractionState();
            this.resetHistoryState();
            this.requestRefresh();
        }
        getEditorState() {
            return cloneEditorState(this.eState);
        }
        resetInteractionState() {
            this.iState = {
                selectedKnotNdx: undefined,
                potentialKnotNdx: undefined,
                knotDragging: false,
                planeDragging: false
            };
        }
        reset() {
            this.setEditorState(this.initialEState);
        }
        clearKnots() {
            this.eState.knots = Array();
            this.resetInteractionState();
        }
        resetHistoryState() {
            this.hState = {
                undoStack: [],
                undoStackPos: 0
            };
        }
        pushUndoHistoryState() {
            const hState = this.hState;
            hState.undoStack.length = hState.undoStackPos;
            hState.undoStack.push(this.eState.knots.slice());
            hState.undoStackPos = hState.undoStack.length;
        }
        undo() {
            const hState = this.hState;
            if (hState.undoStackPos < 1) {
                return false;
            }
            if (hState.undoStackPos == hState.undoStack.length) {
                hState.undoStack.push(this.eState.knots.slice());
            }
            hState.undoStackPos--;
            this.eState.knots = hState.undoStack[hState.undoStackPos].slice();
            this.resetInteractionState();
            return true;
        }
        redo() {
            const hState = this.hState;
            if (hState.undoStackPos >= hState.undoStack.length - 1) {
                return false;
            }
            hState.undoStackPos++;
            this.eState.knots = hState.undoStack[hState.undoStackPos].slice();
            this.resetInteractionState();
            return true;
        }
        mapLogicalToCanvasXCoordinate(lx) {
            return (lx - this.eState.xMin) * this.canvas.width / (this.eState.xMax - this.eState.xMin);
        }
        mapLogicalToCanvasYCoordinate(ly) {
            return this.canvas.height - (ly - this.eState.yMin) * this.canvas.height / (this.eState.yMax - this.eState.yMin);
        }
        mapLogicalToCanvasCoordinates(lPoint) {
            return { x: this.mapLogicalToCanvasXCoordinate(lPoint.x), y: this.mapLogicalToCanvasYCoordinate(lPoint.y) };
        }
        mapCanvasToLogicalXCoordinate(cx) {
            return this.eState.xMin + cx * (this.eState.xMax - this.eState.xMin) / this.canvas.width;
        }
        mapCanvasToLogicalYCoordinate(cy) {
            return this.eState.yMin + (this.canvas.height - cy) * (this.eState.yMax - this.eState.yMin) / this.canvas.height;
        }
        mapCanvasToLogicalCoordinates(cPoint) {
            return { x: this.mapCanvasToLogicalXCoordinate(cPoint.x), y: this.mapCanvasToLogicalYCoordinate(cPoint.y) };
        }
        mapViewportToCanvasCoordinates(vPoint) {
            const rect = this.canvas.getBoundingClientRect();
            const x1 = vPoint.x - rect.left - (this.canvas.clientLeft || 0);
            const y1 = vPoint.y - rect.top - (this.canvas.clientTop || 0);
            const x = x1 / this.canvas.clientWidth * this.canvas.width;
            const y = y1 / this.canvas.clientHeight * this.canvas.height;
            return { x, y };
        }
        moveCoordinatePlane(cPoint, lPoint) {
            const eState = this.eState;
            const lWidth = eState.xMax - eState.xMin;
            const lHeight = eState.yMax - eState.yMin;
            const cWidth = this.canvas.width;
            const cHeight = this.canvas.height;
            eState.xMin = lPoint.x - cPoint.x * lWidth / cWidth;
            eState.xMax = eState.xMin + lWidth;
            eState.yMin = lPoint.y - (cHeight - cPoint.y) * lHeight / cHeight;
            eState.yMax = eState.yMin + lHeight;
        }
        getZoomFactor(xy) {
            const eState = this.eState;
            return xy ? this.canvas.width / (eState.xMax - eState.xMin) : this.canvas.height / (eState.yMax - eState.yMin);
        }
        zoom(fx, fyOpt, cCenterOpt) {
            const eState = this.eState;
            const fy = (fyOpt != undefined) ? fyOpt : fx;
            const cCenter = cCenterOpt ? cCenterOpt : { x: this.canvas.width / 2, y: this.canvas.height / 2 };
            const lCenter = this.mapCanvasToLogicalCoordinates(cCenter);
            eState.xMax = eState.xMin + (eState.xMax - eState.xMin) / fx;
            eState.yMax = eState.yMin + (eState.yMax - eState.yMin) / fy;
            this.moveCoordinatePlane(cCenter, lCenter);
        }
        deleteKnot(knotNdx) {
            const knots = this.eState.knots;
            const oldKnots = knots.slice();
            knots.splice(knotNdx, 1);
            this.fixUpKnotIndexes(oldKnots);
        }
        moveKnot(knotNdx, newPosition) {
            this.eState.knots[knotNdx] = newPosition;
            this.revampKnots();
        }
        addKnot(newKnot) {
            const knot = PointUtils.clone(newKnot);
            this.eState.knots.push(knot);
            this.revampKnots();
            const knotNdx = PointUtils.findPoint(this.eState.knots, knot);
            if (knotNdx == undefined) {
                throw new Error("Program logic error.");
            }
            return knotNdx;
        }
        replaceKnots(newKnots) {
            this.eState.knots = newKnots;
            this.resetInteractionState();
            this.revampKnots();
        }
        revampKnots() {
            this.sortKnots();
            PointUtils.makeXValsStrictMonotonic(this.eState.knots);
        }
        sortKnots() {
            const oldKnots = this.eState.knots.slice();
            this.eState.knots.sort(function (p1, p2) {
                return (p1.x != p2.x) ? p1.x - p2.x : p1.y - p2.y;
            });
            this.fixUpKnotIndexes(oldKnots);
        }
        fixUpKnotIndexes(oldKnots) {
            this.iState.selectedKnotNdx = PointUtils.mapPointIndex(oldKnots, this.eState.knots, this.iState.selectedKnotNdx);
            this.iState.potentialKnotNdx = PointUtils.mapPointIndex(oldKnots, this.eState.knots, this.iState.potentialKnotNdx);
            this.iState.knotDragging = this.iState.knotDragging && this.iState.selectedKnotNdx != undefined;
        }
        findNearestKnot(cPoint) {
            const knots = this.eState.knots;
            let minDist = undefined;
            let nearestKnotNdx = undefined;
            for (let i = 0; i < knots.length; i++) {
                const lKnot = knots[i];
                const cKnot = this.mapLogicalToCanvasCoordinates(lKnot);
                const d = PointUtils.computeDistance(cKnot, cPoint);
                if (minDist == undefined || d < minDist) {
                    nearestKnotNdx = i;
                    minDist = d;
                }
            }
            return (nearestKnotNdx != undefined) ? { knotNdx: nearestKnotNdx, distance: minDist } : undefined;
        }
        getGridParms(xy) {
            const minSpaceC = xy ? 66 : 50;
            const edge = xy ? this.eState.xMin : this.eState.yMin;
            const minSpaceL = minSpaceC / this.getZoomFactor(xy);
            const decPow = Math.ceil(Math.log(minSpaceL / 5) / Math.LN10);
            const edgeDecPow = (edge == 0) ? -99 : Math.log(Math.abs(edge)) / Math.LN10;
            if (edgeDecPow - decPow > 10) {
                return undefined;
            }
            const space = Math.pow(10, decPow);
            const f = minSpaceL / space;
            const span = (f > 2.001) ? 5 : (f > 1.001) ? 2 : 1;
            const p1 = Math.ceil(edge / space);
            const pos = span * Math.ceil(p1 / span);
            return { space, span, pos, decPow };
        }
        createInterpolationFunction() {
            const knots = this.eState.knots;
            const n = knots.length;
            const xVals = new Float64Array(n);
            const yVals = new Float64Array(n);
            for (let i = 0; i < n; i++) {
                xVals[i] = knots[i].x;
                yVals[i] = knots[i].y;
            }
            return createInterpolatorWithFallback(this.eState.interpolationMethod, xVals, yVals);
        }
        requestRefresh() {
            if (this.animationFramePending || !this.isConnected) {
                return;
            }
            requestAnimationFrame(this.animationFrameHandler);
            this.animationFramePending = true;
        }
        refresh() {
            this.plotter.paint();
            this.updateCanvasCursorStyle();
        }
        updateCanvasCursorStyle() {
            const style = (this.iState.knotDragging || this.iState.planeDragging) ? "move" : "auto";
            this.canvas.style.cursor = style;
        }
        fireChangeEvent() {
            const event = new CustomEvent("change");
            this.eventTarget.dispatchEvent(event);
        }
    }
    function cloneEditorState(eState) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const eState2 = {};
        eState2.knots = (_a = eState.knots, (_a !== null && _a !== void 0 ? _a : [])).slice();
        eState2.xMin = (_b = eState.xMin, (_b !== null && _b !== void 0 ? _b : 0));
        eState2.xMax = (_c = eState.xMax, (_c !== null && _c !== void 0 ? _c : 1));
        eState2.yMin = (_d = eState.yMin, (_d !== null && _d !== void 0 ? _d : 0));
        eState2.yMax = (_e = eState.yMax, (_e !== null && _e !== void 0 ? _e : 1));
        eState2.extendedDomain = (_f = eState.extendedDomain, (_f !== null && _f !== void 0 ? _f : true));
        eState2.relevantXMin = eState.relevantXMin;
        eState2.relevantXMax = eState.relevantXMax;
        eState2.gridEnabled = (_g = eState.gridEnabled, (_g !== null && _g !== void 0 ? _g : true));
        eState2.snapToGridEnabled = (_h = eState.snapToGridEnabled, (_h !== null && _h !== void 0 ? _h : true));
        eState2.interpolationMethod = (_j = eState.interpolationMethod, (_j !== null && _j !== void 0 ? _j : "akima"));
        eState2.primaryZoomMode = (_k = eState.primaryZoomMode, (_k !== null && _k !== void 0 ? _k : 2));
        return eState2;
    }
    class Widget {
        constructor(canvas, connected = true) {
            this.wctx = new WidgetContext(canvas);
            if (connected) {
                this.setConnected(true);
            }
        }
        setEventTarget(eventTarget) {
            this.wctx.eventTarget = eventTarget;
        }
        setConnected(connected) {
            const wctx = this.wctx;
            this.wctx.setConnected(connected);
            if (connected) {
                wctx.adjustBackingBitmapResolution();
            }
        }
        addEventListener(type, listener) {
            this.wctx.eventTarget.addEventListener(type, listener);
        }
        removeEventListener(type, listener) {
            this.wctx.eventTarget.removeEventListener(type, listener);
        }
        getEditorState() {
            return this.wctx.getEditorState();
        }
        setEditorState(eState) {
            const wctx = this.wctx;
            wctx.setEditorState(eState);
        }
        getFunction() {
            return this.wctx.createInterpolationFunction();
        }
        getRawHelpText() {
            const pz = this.wctx.eState.primaryZoomMode;
            const primaryZoomAxis = (pz == 0) ? "x-axis" : (pz == 1) ? "y-axis" : "both axes";
            return [
                "drag knot with mouse or touch", "move a knot",
                "drag plane with mouse or touch", "move the coordinate space",
                "click or tap on knot", "select a knot",
                "Delete / Backspace", "delete the selected knot",
                "double-click or double-tap", "create a new knot",
                "Esc", "abort moving",
                "Ctrl+Z / Alt+Backspace", "undo",
                "Ctrl+Y / Ctrl+Shift+Z", "redo",
                "mouse wheel", "zoom " + primaryZoomAxis,
                "shift + mouse wheel", "zoom y-axis",
                "ctrl + mouse wheel", "zoom both axes",
                "alt + mouse wheel", "zoom x-axis",
                "touch zoom gesture", "zoom x, y or both axes",
                "+ / -", "zoom both axes in/out",
                "X / x", "zoom x-axis in/out",
                "Y / y", "zoom y-axis in/out",
                "e", "toggle extended function domain",
                "g", "toggle coordinate grid",
                "s", "toggle snap to grid",
                "l", "toggle between linear interpolation and Akima",
                "k", "knots (display prompt with coordinate values)",
                "r", "re-sample knots",
                "c", "clear the canvas",
                "i", "reset to the initial state"
            ];
        }
        getFormattedHelpText() {
            const t = this.getRawHelpText();
            const a = [];
            a.push("<table class='functionCurveEditorHelp'>");
            a.push("<colgroup>");
            a.push("<col class='functionCurveEditorHelpCol1'>");
            a.push("<col class='functionCurveEditorHelpCol2'>");
            a.push("</colgroup>");
            a.push("<tbody>");
            for (let i = 0; i < t.length; i += 2) {
                a.push("<tr><td>");
                a.push(t[i]);
                a.push("</td><td>");
                a.push(t[i + 1]);
                a.push("</td>");
            }
            a.push("</tbody>");
            a.push("</table>");
            return a.join("");
        }
    }

    let widget;
    const initialKnots = [
        { x: 0, y: 0.5 },
        { x: 1, y: 1 },
        { x: 2, y: 0.5 },
        { x: 3, y: 0.75 },
        { x: 4, y: 0.25 },
        { x: 5, y: 1 },
        { x: 6, y: -0.5 },
        { x: 200, y: 0 }
    ];
    const initialEditorState = {
        knots: initialKnots,
        xMin: 0,
        xMax: 200,
        yMin: -15,
        yMax: 60,
        extendedDomain: false,
        relevantXMin: 0,
        relevantXMax: 200,
        gridEnabled: true
    };
    function dumpFunctionValues(f) {
        for (let x = -1; x < 10; x++) {
            console.log("f(" + x + ") = " + f(x));
        }
    }
    function toggleHelp() {
        const t = document.getElementById("helpText");
        if (t.classList.contains("hidden")) {
            t.classList.remove("hidden");
            t.innerHTML = widget.getFormattedHelpText();
        }
        else {
            t.classList.add("hidden");
        }
    }
    function startup2() {
        const canvas = document.getElementById("functionCurveEditor");
        widget = new Widget(canvas);
        widget.setEditorState(initialEditorState);
        widget.addEventListener("change", () => console.log("Change event"));
        document.getElementById("helpButton").addEventListener("click", toggleHelp);
        document.getElementById("dumpButton").addEventListener("click", () => dumpFunctionValues(widget.getFunction()));
    }
    function startup() {
        try {
            startup2();
        }
        catch (e) {
            console.log(e);
            alert("Error: " + e);
        }
    }
    document.addEventListener("DOMContentLoaded", startup);

}());
