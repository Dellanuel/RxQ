import { Observable } from "rxjs";
import nonLiftedOperators from "./nonLiftedOperators";
import AppObservable from "./AppObservable";
import extendPrototype from "../util/qix-extend-prototype";
import outputTypes from "../util/qix-obs-types";
import QixGlobal from "../qix-classes/qix-global";

class GlobalObservable extends Observable {

    constructor(source) {
        super();
        this.source = source
            .mergeMap(m=>{
                if(m instanceof QixGlobal) {
                    return Observable.of(m);
                }
                else {
                    return Observable.throw(new Error("Data type mismatch: Emitted value is not instance of QixGlobal"));
                }
            });
    }

    lift(operator) {
        const operatorName = operator.constructor.name;
        const operatorCheck = operatorName.slice(0,1).toLowerCase() + operatorName.slice(1,operatorName.indexOf("Operator"));

        // If operator is on list, lift it. otherwise, return basic observable
        const observable = nonLiftedOperators.indexOf(operatorCheck) < 0 ? new GlobalObservable() : new Observable();
        observable.source = this;
        observable.operator = operator;
        return observable;
    }

}

// Add in QIX operators for global
extendPrototype(GlobalObservable,"Global");

// Override certain properties to return DocObservables
const outputs = outputTypes.Global;
const qObs = {
    "AppObservable": AppObservable
};

outputs.forEach(e=>{
    const methodName = e.method;
    const methodNameOrig = methodName.slice(0,1).toUpperCase() + methodName.slice(1);
    const obsClass = qObs[e.obsType];
    GlobalObservable.prototype[methodName] = function(...args) {
        return this
            .mergeMap(e=>e[methodNameOrig](...args))
            .let(o=>new obsClass(o));
    };
});


export default GlobalObservable;