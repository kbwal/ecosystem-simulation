import { AnimalAction, AnimalState } from "@/types/animalTypes";
import { QuickJSContext } from "quickjs-emscripten";

export function runScriptSafely(vm: QuickJSContext, state: AnimalState, script: string) {
    const startTime = Date.now();
    const LIMIT_MS = 25;
    vm.runtime.setInterruptHandler(() => {
        return Date.now() - startTime > LIMIT_MS;
    });

    try {
        const fnResult = vm.evalCode(`(${script})`);
        if (fnResult.error) {
            vm.dump(fnResult.error);
            fnResult.error.dispose();
            return null;
        }

        const fn = vm.unwrapResult(fnResult);
        const stateHandle = vm.newObject();

        const energyHandle = vm.newNumber(state.energy);
        const ageHandle = vm.newNumber(state.age);
        vm.setProp(stateHandle, "energy", energyHandle);
        vm.setProp(stateHandle, "age", ageHandle);
        energyHandle.dispose();
        ageHandle.dispose();

        const positionResult = vm.evalCode(`(${JSON.stringify(state.position)})`);
        const nearbyAnimalsResult = vm.evalCode(`(${JSON.stringify(state.nearbyAnimals)})`);
        const nearbyFoodResult = vm.evalCode(`(${JSON.stringify(state.nearbyFood)})`);

        if (!nearbyAnimalsResult.error && !nearbyFoodResult.error && !positionResult.error) {
            vm.setProp(stateHandle, "nearbyAnimals", vm.unwrapResult(nearbyAnimalsResult));
            vm.setProp(stateHandle, "nearbyFood", vm.unwrapResult(nearbyFoodResult));
            vm.setProp(stateHandle, "position", vm.unwrapResult(positionResult));
        }

        if (positionResult.error) {
            positionResult.error.dispose();
        } else {
            vm.unwrapResult(positionResult).dispose();
        }

        if (nearbyAnimalsResult.error) {
            nearbyAnimalsResult.error.dispose();
        } else {
            vm.unwrapResult(nearbyAnimalsResult).dispose();
        }

        if (nearbyFoodResult.error) {
            nearbyFoodResult.error.dispose();
        } else {
            vm.unwrapResult(nearbyFoodResult).dispose();
        }

        const callResult = vm.callFunction(fn, vm.undefined, stateHandle);
        fn.dispose();
        stateHandle.dispose();

        if (callResult.error) {
            vm.dump(callResult.error);
            callResult.error.dispose();
            return null;
        }

        const valueHandle = vm.unwrapResult(callResult);
        const value: AnimalAction = vm.dump(valueHandle);
        valueHandle.dispose();

        return value;
    } finally {
        vm.runtime.removeInterruptHandler();
    }
}
