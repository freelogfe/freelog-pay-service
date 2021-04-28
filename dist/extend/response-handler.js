"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ResponseHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHandler = void 0;
const decorator_1 = require("@midwayjs/decorator");
const egg_freelog_base_1 = require("egg-freelog-base");
const freelog_common_func_1 = require("egg-freelog-base/lib/freelog-common-func");
const account_info_1 = require("../controller/account-info");
const transaction_info_1 = require("../controller/transaction-info");
let ResponseHandler = ResponseHandler_1 = class ResponseHandler {
    async before(point) {
    }
    afterReturn(joinPoint, result) {
        return freelog_common_func_1.buildApiFormatData(egg_freelog_base_1.RetCodeEnum.success, egg_freelog_base_1.ErrCodeEnum.success, 'success', result);
    }
    static get scopeControllers() {
        return [account_info_1.AccountInfoController, transaction_info_1.TransactionInfoController];
    }
};
ResponseHandler = ResponseHandler_1 = __decorate([
    decorator_1.Provide(),
    decorator_1.Aspect(ResponseHandler_1.scopeControllers)
], ResponseHandler);
exports.ResponseHandler = ResponseHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzcG9uc2UtaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiJEOi/lt6XkvZwvZnJlZWxvZy1wYXktc2VydmljZS9zcmMvIiwic291cmNlcyI6WyJleHRlbmQvcmVzcG9uc2UtaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsbURBQThFO0FBQzlFLHVEQUEwRDtBQUMxRCxrRkFBNEU7QUFDNUUsNkRBQWlFO0FBQ2pFLHFFQUF5RTtBQUl6RSxJQUFhLGVBQWUsdUJBQTVCLE1BQWEsZUFBZTtJQUN4QixLQUFLLENBQUMsTUFBTSxDQUFDLEtBQWdCO0lBRTdCLENBQUM7SUFFRCxXQUFXLENBQUMsU0FBb0IsRUFBRSxNQUFXO1FBQ3pDLE9BQU8sd0NBQWtCLENBQUMsOEJBQVcsQ0FBQyxPQUFPLEVBQUUsOEJBQVcsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNGLENBQUM7SUFFRCxNQUFNLEtBQUssZ0JBQWdCO1FBQ3ZCLE9BQU8sQ0FBQyxvQ0FBcUIsRUFBRSw0Q0FBeUIsQ0FBQyxDQUFDO0lBQzlELENBQUM7Q0FDSixDQUFBO0FBWlksZUFBZTtJQUYzQixtQkFBTyxFQUFFO0lBQ1Qsa0JBQU0sQ0FBQyxpQkFBZSxDQUFDLGdCQUFnQixDQUFDO0dBQzVCLGVBQWUsQ0FZM0I7QUFaWSwwQ0FBZSJ9