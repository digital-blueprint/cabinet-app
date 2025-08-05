/**
 * Controller for observing resize events on a host element and applying rules based on its size.
 * minWidth, maxWidth, minHeight, and maxHeight can be specified in the rules.
 *
 * const rules = [
 *   { name: 'small', maxWidth: 400 },
 *   { name: 'medium', minWidth: 401, maxWidth: 800 },
 *   { name: 'large', minWidth: 801 }
 * ];
 * const controller = new ResizeController(hostElement, rules);
 *
 * In CSS check with ":host(.container--small)", or in JavaScript with
 * controller.matches('small') to see if the current size matches the rule.
 */
export class ResponsiveController {
    constructor(host, rules = [], classPrefix = 'container--') {
        this._host = host;
        this._rules = rules;
        this._matchedQueries = new Set();
        this._classPrefix = classPrefix;
        this._host.addController(this);
    }

    hostConnected() {
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                this._updateMatchedQueries(entry.contentRect);
            }
        });
        this.resizeObserver.observe(this._host);
    }

    hostDisconnected() {
        this.resizeObserver?.disconnect();
    }

    _updateMatchedQueries(rect) {
        const previousMatches = new Set(this._matchedQueries);
        this._matchedQueries.clear();

        for (const rule of this._rules) {
            if (this._matchesRule(rule, rect)) {
                this._matchedQueries.add(rule.name);
            }
        }

        for (const oldMatch of previousMatches) {
            this._host.classList.remove(`${this._classPrefix}${oldMatch}`);
        }

        for (const newMatch of this._matchedQueries) {
            this._host.classList.add(`${this._classPrefix}${newMatch}`);
        }

        function setsEqual(a, b) {
            return a.size === b.size && [...a].every((x) => b.has(x));
        }

        // Only trigger update if matches changed
        if (!setsEqual(previousMatches, this._matchedQueries)) {
            this._host.requestUpdate();
        }
    }

    _matchesRule(rule, rect) {
        if (rule.minWidth !== undefined && rect.width < rule.minWidth) return false;
        if (rule.maxWidth !== undefined && rect.width > rule.maxWidth) return false;
        if (rule.minHeight !== undefined && rect.height < rule.minHeight) return false;
        if (rule.maxHeight !== undefined && rect.height > rule.maxHeight) return false;
        return true;
    }

    /**
     * Checks if a specific query is currently matched.
     * @param {string} query - The name of the query to check.
     * @returns {boolean} True if the query is matched, false otherwise.
     */
    matches(query) {
        return this._matchedQueries.has(query);
    }
}
