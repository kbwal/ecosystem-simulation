import { AnimalAction, AnimalState } from "@/types/animalTypes";
import { QuickJSWASMModule } from "quickjs-emscripten";

export function runScriptSafely(QuickJS: QuickJSWASMModule, state: AnimalState, script: string) {
    const vm = QuickJS.newContext();

    const startTime = Date.now();
    vm.runtime.setInterruptHandler(() => {
        return Date.now() - startTime > 50;
    });

    // 8 megabytes -> this should give breathing room for more things in state in the future
    // might even be over-kill
    vm.runtime.setMemoryLimit(2 ** 10 * 2 ** 10 * 8);

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

        const nearbyAnimalsResult = vm.evalCode(`(${JSON.stringify(state.nearbyAnimals)})`);
        const nearbyFoodResult = vm.evalCode(`(${JSON.stringify(state.nearbyFood)})`);

        if (!nearbyAnimalsResult.error && !nearbyFoodResult.error) {
            vm.setProp(stateHandle, "nearbyAnimals", vm.unwrapResult(nearbyAnimalsResult));
            vm.setProp(stateHandle, "nearbyFood", vm.unwrapResult(nearbyFoodResult));
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
        vm.dispose();
    }
}
