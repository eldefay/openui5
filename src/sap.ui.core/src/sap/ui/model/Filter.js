/*!
 * ${copyright}
 */
/*eslint-disable max-len */
// Provides a filter for list bindings
sap.ui.define([
	'sap/ui/base/Object',
	'./FilterOperator',
	"sap/base/Log"
],
	function(BaseObject, FilterOperator, Log) {
	"use strict";

	/**
	 * Constructor for Filter.
	 *
	 * You either pass a single object literal with the filter parameters or use the individual
	 * constructor arguments. No matter which variant is used, only certain combinations of
	 * parameters are supported (the following list uses the names from the object literal):
	 * <ul>
	 * <li>A <code>path</code>, <code>operator</code> and one or two values (<code>value1</code>,
	 *   <code>value2</code>), depending on the operator</li>
	 * <li>A <code>path</code> and a custom filter function <code>test</code></li>
	 * <li>An array of other filters named <code>filters</code> and a Boolean flag <code>and</code>
	 *   that specifies whether to combine the filters with an AND (<code>true</code>) or an OR
	 *   (<code>false</code>) operator.</li>
	 * </ul>
	 * An error will be logged to the console if an invalid combination of parameters is provided.
	 * Please note that a model implementation may not support a custom filter function, e.g. if the
	 * model does not perform client side filtering. It also depends on the model implementation if
	 * the filtering is case sensitive or not. Client models filter case insensitive compared to the
	 * OData models which filter case sensitive by default.
	 * See particular model documentation for details
	 * The filter operators <code>Any</code> and <code>All</code> are only supported in V4 OData
	 * models. When creating a filter instance with these filter operators, the argument
	 * <code>variable</code> only accepts a string identifier and <code>condition</code> needs to be
	 * another filter instance.
	 *
	 * @example <caption>Using an object with a path, an operator and one or two values</caption>
	 *
	 *   sap.ui.define(['sap/ui/model/Filter', 'sap/ui/model/FilterOperator'], function(Filter, FilterOperator) {
	 *     new Filter({
	 *       path: "Price",
	 *       operator: FilterOperator.BT,
	 *       value1: 11.0,
	 *       value2: 23.0
	 *     });
	 *   });
	 *
	 * @example <caption>Using a path and a custom filter function</caption>
	 *
	 *   new sap.ui.model.Filter({
	 *     path: "Price",
	 *     test: function(oValue) {
	 *        ...
	 *     }
	 *   })
	 *
	 * @example <caption>Combining a list of filters either with AND or OR</caption>
	 *
	 *   new Filter({
	 *     filters: [
	 *       ...
	 *       new Filter({
	 *         path: 'Quantity',
	 *         operator: FilterOperator.LT,
	 *         value1: 20
	 *       }),
	 *       new Filter({
	 *         path: 'Price',
	 *         operator: FilterOperator.GT,
	 *         value1: 14.0
	 *       })
	 *       ...
	 *     ],
	 *     and: true|false
	 *   })
	 *
	 * @example <caption>The filter operators <code>Any</code> and <code>All</code> map to the OData
	 *   V4 lambda operators <code>any</code> and <code>all</code>. They take a variable and another
	 *   filter as parameter and evaluate it on either a collection property or a collection of
	 *   entities.</caption>
	 *
	 *   // find Orders where all of the 'Items' in the order have a 'Quantity' > 100
	 *   // (assumes that Filter and FilterOperator have been declared as dependencies, see previous examples)
	 *   new Filter({
	 *     path: 'Items',
	 *     operator: FilterOperator.All,
	 *     variable: 'item',
	 *     condition: new Filter({
	 *       path: 'item/Quantity',
	 *       operator: FilterOperator.GT,
	 *       value1: 100.0
	 *     })
	 *   });
	 *
	 * @example <caption>For the filter operator <code>Any</code> either both a lambda
	 *   <code>variable</code> and a <code>condition</code> have to be given or neither.</caption>
	 *   new Filter({
	 *     path: 'Items',
	 *     operator: FilterOperator.Any
	 *   });
	 *
	 * @example <caption>Legacy signature: Same as above, but using individual constructor
	 *   arguments. Not supported for filter operators <code>Any</code> and <code>All</code>.
	 *   </caption>
	 *
	 *     new sap.ui.model.Filter(sPath, sOperator, vValue1, vValue2);
	 *   OR
	 *     new sap.ui.model.Filter(sPath, fnTest);
	 *   OR
	 *     new sap.ui.model.Filter(aFilters, bAnd);
	 *
	 * @class
	 * Filter for the list binding.
	 *
	 * @param {object|string|sap.ui.model.Filter[]} vFilterInfo
	 *   Filter info object or a path or an array of filters
	 * @param {string} [vFilterInfo.path]
	 *   Binding path for this filter
	 * @param {function} [vFilterInfo.test]
	 *   Function which is used to filter the items and which should return a Boolean value to
	 *   indicate whether the current item passes the filter
	 * @param {function} [vFilterInfo.comparator]
	 *   Function which is used to compare two values, this is used for processing of equal, less
	 *   than and greater than operators
	 * @param {sap.ui.model.FilterOperator} [vFilterInfo.operator]
	 *   Operator used for the filter
	 * @param {any} [vFilterInfo.value1]
	 *   First value to use with the given filter operator
	 * @param {any} [vFilterInfo.value2=null]
	 *   Second value to use with the filter operator (only for some operators)
	 * @param {string} [vFilterInfo.variable]
	 *   The variable used in lambda operators (<code>Any</code> and <code>All</code>)
	 * @param {sap.ui.model.Filter} [vFilterInfo.condition]
	 *   A <code>Filter</code> instance which will be used as the condition for the lambda operator
	 * @param {sap.ui.model.Filter[]} [vFilterInfo.filters]
	 *   Array of filters on which logical conjunction is applied
	 * @param {boolean} [vFilterInfo.and=false]
	 *   Indicates whether an "AND" logical conjunction is applied on the filters. If it's not set
	 *   or set to <code>false</code>, an "OR" conjunction is applied
	 * @param {boolean} [vFilterInfo.caseSensitive]
	 *   Indicates whether a string value should be compared case sensitive or not.
	 * @param {sap.ui.model.FilterOperator|function|boolean} [vOperator]
	 *   Either a filter operator or a custom filter function or a Boolean flag that defines how to
	 *   combine multiple filters
	 * @param {any} [vValue1]
	 *   First value to use with the given filter operator
	 * @param {any} [vValue2]
	 *   Second value to use with the given filter operator (only for some operators)
	 *
	 * @public
	 * @alias sap.ui.model.Filter
	 * @extends sap.ui.base.Object
	 */
	var Filter = BaseObject.extend("sap.ui.model.Filter", /** @lends sap.ui.model.Filter.prototype */ {
		constructor : function(vFilterInfo, vOperator, vValue1, vValue2){
			//There are two different ways of specifying a filter
			//It can be passed in only one object or defined with parameters
			if (typeof vFilterInfo === "object" && !Array.isArray(vFilterInfo)) {
				this.sPath = vFilterInfo.path;
				this.sOperator = vFilterInfo.operator;
				this.oValue1 = vFilterInfo.value1;
				this.oValue2 = vFilterInfo.value2;
				this.sVariable = vFilterInfo.variable;
				this.oCondition = vFilterInfo.condition;
				this.aFilters = vFilterInfo.filters || vFilterInfo.aFilters; // support legacy name 'aFilters' (intentionally not documented)
				this.bAnd = vFilterInfo.and || vFilterInfo.bAnd; // support legacy name 'bAnd' (intentionally not documented)
				this.fnTest = vFilterInfo.test;
				this.fnCompare = vFilterInfo.comparator;
				this.bCaseSensitive = vFilterInfo.caseSensitive;
			} else {
				//If parameters are used we have to check whether a regular or a multi filter is specified
				if (Array.isArray(vFilterInfo)) {
					this.aFilters = vFilterInfo;
				} else {
					this.sPath = vFilterInfo;
				}
				if (typeof vOperator === "boolean") {
					this.bAnd = vOperator;
				} else if (typeof vOperator === "function" ) {
					this.fnTest = vOperator;
				} else {
					this.sOperator = vOperator;
				}
				this.oValue1 = vValue1;
				this.oValue2 = vValue2;

				if (this.sOperator === FilterOperator.Any || this.sOperator === FilterOperator.All) {
					throw new Error("The filter operators 'Any' and 'All' are only supported with the parameter object notation.");
				}
			}

			if (this.sOperator === FilterOperator.Any) {
				// for the Any operator we only have to further check the arguments if both are given
				if (this.sVariable && this.oCondition) {
					this._checkLambdaArgumentTypes();
				} else if (!this.sVariable && !this.oCondition) {
					// 'Any' accepts no arguments
				} else {
					// one argument is missing
					throw new Error("When using the filter operator 'Any', a lambda variable and a condition have to be given or neither.");
				}
			} else if (this.sOperator === FilterOperator.All) {
				this._checkLambdaArgumentTypes();
			} else if (Array.isArray(this.aFilters) && !this.sPath && !this.sOperator
					&& !this.oValue1 && !this.oValue2) {
				this._bMultiFilter = true;
				if ( !this.aFilters.every(isFilter) ) {
					Log.error("Filter in Aggregation of Multi filter has to be instance of"
						+ " sap.ui.model.Filter");
				}
			} else if (!this.aFilters && this.sPath !== undefined
					&& ((this.sOperator && this.oValue1 !== undefined) || this.fnTest)) {
				this._bMultiFilter = false;
			} else {
				Log.error("Wrong parameters defined for filter.");
			}
		}
	});

	/**
	 * Checks the types of the arguments for a lambda operator.
	 * @private
	 */
	Filter.prototype._checkLambdaArgumentTypes = function () {
		if (!this.sVariable || typeof this.sVariable !== "string") {
			throw new Error("When using the filter operators 'Any' or 'All', a string has to be given as argument 'variable'.");
		}
		if (!isFilter(this.oCondition)) {
			throw new Error("When using the filter operator 'Any' or 'All', a valid instance of sap.ui.model.Filter has to be given as argument 'condition'.");
		}
	};

	function isFilter(v) {
		return v instanceof Filter;
	}

	var Type = {
		Logical: "Logical",
		Binary: "Binary",
		Unary: "Unary",
		Lambda: "Lambda",
		Reference: "Reference",
		Literal: "Literal",
		Variable: "Variable",
		Call: "Call",
		Custom: "Custom"
	};

	var Op = {
		Equal: "==",
		NotEqual: "!=",
		LessThan: "<",
		GreaterThan: ">",
		LessThanOrEqual: "<=",
		GreaterThanOrEqual: ">=",
		And: "&&",
		Or: "||",
		Not: "!"
	};

	var Func = {
		Contains: "contains",
		StartsWith: "startswith",
		EndsWith: "endswith"
	};

	/**
	 * Returns an AST for the filter.
	 *
	 * @param {boolean} bIncludeOrigin Whether the origin should be included in the AST
	 *
	 * @returns {object} An AST for the filter
	 * @private
	 */
	Filter.prototype.getAST = function (bIncludeOrigin) {
		var oResult, sOp, sOrigOp, oRef, oValue, oFromValue, oToValue, oVariable, oCondition;
		function logical(sOp, oLeft, oRight) {
			return {
				type: Type.Logical,
				op: sOp,
				left: oLeft,
				right: oRight
			};
		}
		function binary(sOp, oLeft, oRight) {
			return {
				type: Type.Binary,
				op: sOp,
				left: oLeft,
				right: oRight
			};
		}
		function unary(sOp, oArg) {
			return {
				type: Type.Unary,
				op: sOp,
				arg: oArg
			};
		}
		function lambda(sOp, oRef, oVariable, oCondition) {
			return {
				type: Type.Lambda,
				op: sOp,
				ref: oRef,
				variable: oVariable,
				condition: oCondition
			};
		}
		function reference(sPath) {
			return {
				type: Type.Reference,
				path: sPath
			};
		}
		function literal(vValue) {
			return {
				type: Type.Literal,
				value: vValue
			};
		}
		function variable(sName) {
			return {
				type: Type.Variable,
				name: sName
			};
		}
		function call(sName, aArguments) {
			return {
				type: Type.Call,
				name: sName,
				args: aArguments
			};
		}
		if (this.aFilters) { // multi filters
			sOp = this.bAnd ? Op.And : Op.Or;
			sOrigOp = this.bAnd ? "AND" : "OR";
			oResult = this.aFilters[this.aFilters.length - 1].getAST(bIncludeOrigin);
			for (var i = this.aFilters.length - 2; i >= 0; i--) {
				oResult = logical(sOp, this.aFilters[i].getAST(bIncludeOrigin), oResult);
			}
		} else { // other filter
			sOp = this.sOperator;
			sOrigOp = this.sOperator;
			oRef = reference(this.sPath);
			oValue = literal(this.oValue1);
			switch (sOp) {
				case FilterOperator.EQ:
					oResult = binary(Op.Equal, oRef, oValue);
					break;
				case FilterOperator.NE:
					oResult = binary(Op.NotEqual, oRef, oValue);
					break;
				case FilterOperator.LT:
					oResult = binary(Op.LessThan, oRef, oValue);
					break;
				case FilterOperator.GT:
					oResult = binary(Op.GreaterThan, oRef, oValue);
					break;
				case FilterOperator.LE:
					oResult = binary(Op.LessThanOrEqual, oRef, oValue);
					break;
				case FilterOperator.GE:
					oResult = binary(Op.GreaterThanOrEqual, oRef, oValue);
					break;
				case FilterOperator.Contains:
					oResult = call(Func.Contains, [oRef, oValue]);
					break;
				case FilterOperator.StartsWith:
					oResult = call(Func.StartsWith, [oRef, oValue]);
					break;
				case FilterOperator.EndsWith:
					oResult = call(Func.EndsWith, [oRef, oValue]);
					break;
				case FilterOperator.NotContains:
					oResult = unary(Op.Not, call(Func.Contains, [oRef, oValue]));
					break;
				case FilterOperator.NotStartsWith:
					oResult = unary(Op.Not, call(Func.StartsWith, [oRef, oValue]));
					break;
				case FilterOperator.NotEndsWith:
					oResult = unary(Op.Not, call(Func.EndsWith, [oRef, oValue]));
					break;
				case FilterOperator.BT:
					oFromValue = oValue;
					oToValue = literal(this.oValue2);
					oResult = logical(Op.And,
						binary(Op.GreaterThanOrEqual, oRef, oFromValue),
						binary(Op.LessThanOrEqual, oRef, oToValue)
					);
					break;
				case FilterOperator.NB:
					oFromValue = oValue;
					oToValue = literal(this.oValue2);
					oResult = logical(Op.Or,
						binary(Op.LessThan, oRef, oFromValue),
						binary(Op.GreaterThan, oRef, oToValue)
					);
					break;
				case FilterOperator.Any:
				case FilterOperator.All:
					oVariable = variable(this.sVariable);
					oCondition = this.oCondition.getAST(bIncludeOrigin);
					oResult = lambda(sOp, oRef, oVariable, oCondition);
					break;
				default:
					throw new Error("Unknown operator: " + sOp);
			}
		}
		if (bIncludeOrigin && !oResult.origin) {
			oResult.origin = sOrigOp;
		}
		return oResult;
};

	/**
	 * Compares two values
	 *
	 * This is the default comparator function used for clientside filtering, if no custom comparator is given in the
	 * constructor. It does compare just by using equal/less than/greater than with automatic type casting, except
	 * for null values, which are neither less or greater, and string values where localeCompare is used.
	 *
	 * The comparator method returns -1, 0, 1 for comparable values and NaN for non-comparable values.
	 *
	 * @param {any} a the first value to compare
	 * @param {any} b the second value to compare
	 * @returns {int} -1, 0, 1 or NaN depending on the compare result
	 * @public
	 */
	Filter.defaultComparator = function(a, b) {
		if (a == b) {
			return 0;
		}
		if (a == null || b == null) {
			return NaN;
		}
		if (typeof a == "string" && typeof b == "string") {
			return a.localeCompare(b);
		}
		if (a < b) {
			return -1;
		}
		if (a > b) {
			return 1;
		}
		return NaN;
	};


	return Filter;

});