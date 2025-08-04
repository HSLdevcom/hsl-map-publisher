/**
 * Returns whether the stop data matches all the rules.
 * Is called recursively
 * @param {Object} rules - Template rules
 * @param {Object} stop - Stop data
 * @returns {Boolean}
 */
function matchStopDataToRules(rules, data) {
  // Function to check subrules and evaluate operands
  const evaluateOper = ruleset => {
    const checkSubRules = subrules => matchStopDataToRules(subrules, data);
    switch (ruleset.name) {
      case 'AND':
        return ruleset.value.every(checkSubRules);
      case 'OR':
        return ruleset.value.some(checkSubRules);
      case 'NOT':
        return !checkSubRules(ruleset.value[0]);
      default:
        throw new Error(`Invalid operand name: ${ruleset.name}`);
    }
  };

  // function to evaluate the specific rule
  const evaluateRule = ruleset => {
    switch (ruleset.name) {
      case 'CITY':
        return ruleset.value === data.city;
      case 'MODE':
        return data.modes.includes(ruleset.value);
      case 'ZONE':
        return ruleset.value === data.stopZone;
      case 'ROUTE':
        return data.routeIds.includes(ruleset.value);
      default:
        throw new Error(`Invalid rule name: ${ruleset.name}`);
    }
  };

  switch (rules.type) {
    case 'OPER':
      return evaluateOper(rules, data);
    case 'RULE':
      return evaluateRule(rules, data);
    default:
      throw new Error(`Invalid rule type: ${rules.type}`);
  }
}

module.exports = {
  matchStopDataToRules,
};
