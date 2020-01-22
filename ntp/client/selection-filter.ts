import {FilteredSample} from "./clock-filter";


const MAX_DISP = 1000.0; // 1 second;

export class SelectionFilter {
    public static isAcceptable(sample: FilteredSample): boolean {
        return sample.dispersion < MAX_DISP;
    }
}
