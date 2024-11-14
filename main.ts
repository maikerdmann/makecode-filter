namespace Ultraschall_advanced {
    let ultraschall_obj: Ultraschallsensor


    /**
     * Abstand
     */
    //% blockId=abstand
    //% block="Abstand"
    export function abstand(): number {
        return Math.round(ultraschall_obj.filter.current)
    }

    /**
     * stop Advanced
     */
    //% blockId=stopAdvanced
    //% block="stop_ultraschall_advanced"
    export function stop_advanced(): void {
        ultraschall_obj.active = false
    }

    /**
     * Start Ultraschall advanced
     */
    //% blockId=initAdvanced
    //% block="init_utraschall_advanced"
    export function init_advanced(): void {
        ultraschall_obj = new Ultraschallsensor(0.64375)
    }

    class Ultraschallsensor {
        active: boolean;

        trig: DigitalPin;
        echo: DigitalPin;

        low_bound: number;
        high_bound: number;
        cal_factor: number;

        filter: MM;

        current: number;

        constructor(
            factor?: number,
            trig: DigitalPin = DigitalPin.P8, 
            echo: DigitalPin = DigitalPin.P9,
            low_bound: number = 2,
            high_bound: number = 400
            ){
            this.active = true
            this.trig = trig
            this.echo = echo
            this.low_bound = low_bound
            this.high_bound = high_bound
            this.cal_factor = factor
            this.filter = new MM(5)

            control.runInBackground(function () {
                while (this.active) {
                    this.update()
                    basic.pause(50)
                }
            })
        }

        measure(): number {
            pins.setPull(this.trig, PinPullMode.PullNone);
            pins.digitalWritePin(this.trig, 0);
            control.waitMicros(2);
            pins.digitalWritePin(this.trig, 1);
            control.waitMicros(10);
            pins.digitalWritePin(this.trig, 0);

            // read pulse
            const d = pins.pulseIn(this.echo, PulseValue.High, 400 * 58);

            //time divided by 2 times the sonicspeed
            return d / 2 * 0.03432
        }

        is_valid(measurement: number): boolean {
            if (measurement >= this.low_bound && measurement <= this.high_bound) {
                return true
            }
            return false
        }

        update() {
            let messung = this.measure()
            if (this.cal_factor) {
                messung = messung / this.cal_factor
            }
            
            if (this.is_valid(messung)) {
                this.filter.update(messung)
            }
        }

    }

    class MM {
        current: number
        window: number[]
        windowsize: number

        constructor(windowsize: number) {
            this.windowsize = windowsize
            this.window = []
        }

        add_measurement(measurement: number) {
            this.window.push(measurement)
            if (this.window.length > this.windowsize) { this.window.shift() }
        }

        update(measurement: number): number {
            this.add_measurement(measurement)
            if (this.window.length < this.windowsize) { return measurement }

            this.current = this.calculate()
            return this.current
        }

        calculate(): number {
            const temp: number[] = [];
            this.window.forEach((item) => {
                temp.push(item)
            })
            temp.sort((a, b) => a - b);
            if (temp.length % 2 === 0) {
                return (temp[temp.length / 2 - 1] + temp[temp.length / 2]) / 2
            } else if (temp.length === 1) {
                return temp[0];
            } else {
                return temp[Math.floor(temp.length / 2)];
            }
        }

    }
}
