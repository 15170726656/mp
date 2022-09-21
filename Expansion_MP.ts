enum NeoPixelColors {

    //% block=red
    Red = 0xFF0000,
    //% block=orange
    Orange = 0xFFA500,
    //% block=yellow
    Yellow = 0xFFFF00,
    //% block=green
    Green = 0x00FF00,
    //% block=blue
    Blue = 0x0000FF,
    //% block=indigo
    Indigo = 0x4b0082,
    //% block=violet
    Violet = 0x8a2be2,
    //% block=purple
    Purple = 0xFF00FF,
    //% block=white
    White = 0xFFFFFF,
    //% block=black
    Black = 0x000000
}


enum NeoPixelMode {
    //% block="RGB (GRB format)"
    RGB = 1,
    //% block="RGB+W"
    RGBW = 2,
    //% block="RGB (RGB format)"
    RGB_RGB = 3
}


//% weight=100 color=#2699BF icon=""

namespace INNOBITExpansion {


    // 定义电机变量
    enum MPMotors {
        //% blockId="M1Motor" block="M1"
        M1 = 0,
        //% blockId="M2Motor" block="M2"
        M2 = 1,
        //% blockId="AllMotors" block="All"
        MAll = 2
    }

    //定义旋转模式
    enum MPDir {
        //% blockId="CW" block="Forward"
        Forward = 0x0,
        //% blockId="CCW" block="Reverse"
        Reverse = 0x1
    }

    ///////////////////// 初始化电动机///////////////////////
    let DigitalPin_M1 = DigitalPin.P13
    let AnalogPin_M1 = AnalogPin.P14
    let DigitalPin_M2 = DigitalPin.P15
    let AnalogPin_M2 = AnalogPin.P16

    ///////////////////// 方法 ///////////////////////
    ///////////////////// 电动机模块 ///////////////////////

    /**
     *  Initialize motor M2
     *  Set motor speed
     * @param set motor speed (0 to 255)
     */
    //% subcategory="Motor"
    //% blockId="motor_M2" weight=12 blockGap=15
    //% block="Motor speed  M2 %speed|"
    //% speed.min=-255 speed.max=255
    export function motor_M2(speed: number) {
        if (speed < 0) {
            motorRun(MPMotors.M2, MPDir.Forward, Math.abs(speed))
        }
        else {

            motorRun(MPMotors.M2, MPDir.Reverse, 255 - Math.abs(speed))
        }

    }

    /**
        *  Initialize motor M1
        *  Set motor speed
        * @param set motor speed (-255 to 255)
        */
    //% subcategory="Motor"
    //% blockId="motor_M1" weight=12 blockGap=15
    //% block="Motor speed   M1 %speed|"
    //% speed.min=-255 speed.max=255

    export function motor_M1(speed: number) {
        if (speed < 0) {
            motorRun(MPMotors.M1, MPDir.Forward, Math.abs(speed))
        }
        else {
            motorRun(MPMotors.M1, MPDir.Reverse, 255 - Math.abs(speed))
        }

    }


    // 返回速度
    function clamp(value: number, min: number, max: number): number {
        return Math.max(Math.min(max, value), min);
    }


    // 自定义方法控制电机转动
    export function motorRun(index: MPMotors, direction: MPDir, speed: number): void {
        if (index > 2 || index < 0)
            return
        speed = clamp(speed, 0, 255) * 4.01;  // 0~255 > 0~1023
        //  let dir_m2 = direction == MPDir.Forward ? MPDir.Reverse : MPDir.Forward;
        if (index == MPMotors.M1) {
            pins.digitalWritePin(DigitalPin_M1, direction);
            pins.analogWritePin(AnalogPin_M1, speed);
        } else if (index == MPMotors.M2) {
            pins.digitalWritePin(DigitalPin_M2, direction);
            pins.analogWritePin(AnalogPin_M2, speed);
        }
    }

    //  自定义温湿度变量
    enum dataType {
        //% block="humidity"
        humidity,
        //% block="temperature"
        temperature,
    }


    //定义温度类型
    enum tempType {
        //% block="Celsius (*C)"
        celsius,
        //% block="Fahrenheit (*F)"
        fahrenheit,
    }

    //初始化数据
    let _temperature: number = 0
    let _humidity: number = 0
    let _temperature_: number = 0
    let _humidity_: number = 0
    let _temptype: tempType = tempType.celsius
    let _readSuccessful: boolean = false
    let _sensorrespondingtempType: boolean = false



    ///////////////////// DHT11模块 ///////////////////////
    /**
        *  Obtain the temperature using DHT11
        */
    //% subcategory="Temperature and Humidity Sensor"
    //% blockId="readtemperature" weight=12 blockGap=15
    //% block="temperature"
    export function readtemperature(): number {
        return readData(dataType.temperature)
    }

    /**
        *  Obtain the humidity using DHT11
        */
    //% subcategory="Temperature and Humidity Sensor"
    //% blockId="readhumidity" weight=12 blockGap=15
    //% block="humidity"
    export function readhumidity(): number {
        return readData(dataType.humidity)
    }

    /**
     * Customize the DHT11 to obtain the temperature and humidity
    */
    export function readData(data: dataType): number {
        //initialize
        let startTime: number = 0
        let endTime: number = 0
        let checksum: number = 0
        let checksumTmp: number = 0
        let dataArray: boolean[] = []
        let resultArray: number[] = []

        for (let index = 0; index < 40; index++) dataArray.push(false)
        for (let index = 0; index < 5; index++) resultArray.push(0)

        _humidity = 0
        _temperature = 0
        _readSuccessful = false
        startTime = input.runningTimeMicros()

        //request data
        pins.digitalWritePin(DigitalPin.P0, 0)
        basic.pause(18)


        pins.setPull(DigitalPin.P0, PinPullMode.PullUp)
        pins.digitalReadPin(DigitalPin.P0)
        control.waitMicros(40)

        if (pins.digitalReadPin(DigitalPin.P0) != 1) {


            while (pins.digitalReadPin(DigitalPin.P0) == 0); //sensor response
            while (pins.digitalReadPin(DigitalPin.P0) == 1); //sensor response

            //read data (5 bytes)
            for (let index = 0; index < 40; index++) {
                while (pins.digitalReadPin(DigitalPin.P0) == 1);
                while (pins.digitalReadPin(DigitalPin.P0) == 0);
                control.waitMicros(28)
                //if sensor still pull up data pin after 28 us it means 1, otherwise 0
                if (pins.digitalReadPin(DigitalPin.P0) == 1) dataArray[index] = true
            }

            endTime = input.runningTimeMicros()

            //convert byte number array to integer
            for (let index = 0; index < 5; index++)
                for (let index2 = 0; index2 < 8; index2++)
                    if (dataArray[8 * index + index2]) resultArray[index] += 2 ** (7 - index2)

            //verify checksum
            checksumTmp = resultArray[0] + resultArray[1] + resultArray[2] + resultArray[3]
            checksum = resultArray[4]
            if (checksumTmp >= 512) checksumTmp -= 512
            if (checksumTmp >= 256) checksumTmp -= 256
            if (checksum == checksumTmp) _readSuccessful = true

            //read data if checksum ok
            if (_readSuccessful) {

                _humidity = resultArray[0] + resultArray[1] / 100
                _temperature = resultArray[2] + resultArray[3] / 100

                if (_temptype == tempType.fahrenheit)
                    _temperature = _temperature * 9 / 5 + 32
            }
        }
        //设定温湿度值>0
        if (_temperature != _temperature_) {
            if (_temperature < 0) {
                _temperature = _temperature_
            }
            else {
                _temperature_ = _temperature
            }
        }
        if (_humidity != _humidity_) {
            if (_humidity < 0) {
                _humidity = _humidity_
            }
            else {
                _humidity_ = _humidity
            }
        }
        return data == dataType.humidity ? _humidity : _temperature
    }




    ///////////////////// LED模块 ///////////////////////


    export class Strip {
        buf: Buffer;
        pin: DigitalPin;
        // TODO: encode as bytes instead of 32bit
        brightness: number;
        start: number; // start offset in LED strip
        _length: number; // number of LEDs
        _mode: NeoPixelMode;
        _matrixWidth: number; // number of leds in a matrix - if any




        setMatrixWidth(width: number) {
            this._matrixWidth = Math.min(this._length, width >> 0);
        }

        show() {
            ws2812b.sendBuffer(this.buf, this.pin);
        }
        setPixelRGB(pixeloffset: number, rgb: number): void {
            if (pixeloffset < 0
                || pixeloffset >= this._length)
                return;

            let stride = this._mode === NeoPixelMode.RGBW ? 4 : 3;
            pixeloffset = (pixeloffset + this.start) * stride;

            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);

            let br = this.brightness;
            if (br < 255) {
                red = (red * br) >> 8;
                green = (green * br) >> 8;
                blue = (blue * br) >> 8;
            }
            this.setBufferRGB(pixeloffset, red, green, blue)
        }
        setBufferRGB(offset: number, red: number, green: number, blue: number): void {
            if (this._mode === NeoPixelMode.RGB_RGB) {
                this.buf[offset + 0] = red;
                this.buf[offset + 1] = green;
            } else {
                this.buf[offset + 0] = green;
                this.buf[offset + 1] = red;
            }
            this.buf[offset + 2] = blue;
        }

        clear(): void {
            const stride = this._mode === NeoPixelMode.RGBW ? 4 : 3;
            this.buf.fill(0, this.start * stride, this._length * stride);
        }


        setBrightness(brightness: number): void {
            this.brightness = brightness & 0xff;
        }


        setPin(pin: DigitalPin): void {
            this.pin = pin;
            pins.digitalWritePin(this.pin, 0);
            // don't yield to avoid races on initialization
        }


    }


    export function create(pin: DigitalPin, numleds: number, mode: NeoPixelMode): Strip {
        let strip = new Strip();
        let stride = mode === NeoPixelMode.RGBW ? 4 : 3;
        strip.buf = pins.createBuffer(numleds * stride);
        strip.start = 0;
        strip._length = numleds;
        strip._mode = mode || NeoPixelMode.RGB;
        strip._matrixWidth = 0;
        strip.setBrightness(128)
        strip.setPin(pin)
        return strip;
    }






    function packRGB(a: number, b: number, c: number): number {
        return ((a & 0xFF) << 16) | ((b & 0xFF) << 8) | (c & 0xFF);
    }
    function unpackR(rgb: number): number {
        let r = (rgb >> 16) & 0xFF;
        return r;
    }
    function unpackG(rgb: number): number {
        let g = (rgb >> 8) & 0xFF;
        return g;
    }
    function unpackB(rgb: number): number {
        let b = (rgb) & 0xFF;
        return b;
    }



    export function LEDcreate(pin: DigitalPin, numleds: number, mode: NeoPixelMode) {
        let strip = new Strip();
        let stride = mode === NeoPixelMode.RGBW ? 4 : 3;
        strip.buf = pins.createBuffer(numleds * stride);
        strip.start = 0;
        strip._length = numleds;
        strip._mode = mode || NeoPixelMode.RGB;
        strip._matrixWidth = 0;
        strip.setBrightness(128)
        strip.setPin(pin)

    }
    let strip = new Strip();
    let bp = true
    /**
     *  Set the colors of the three LED lights  
     */
    //% subcategory="LED Strip"
    //% blockId="LED_setPixelColor3" 
    //% block=" LED strip LED1： %rgb1=LED_colors, LED2： %rgb2=LED_colors,LED3： %rgb3=LED_colors"
    export function LED_setPixelColor3(rgb1: number, rgb2: number, rgb3: number): void {
        //初始化LED数据
        if (bp) {
            strip = create(DigitalPin.P1, 3, NeoPixelMode.RGB)
            bp = false
        }
        strip.setPixelRGB(0 >> 0, rgb1 >> 0)
        strip.setPixelRGB(1 >> 0, rgb2 >> 0)
        strip.setPixelRGB(2 >> 0, rgb3 >> 0)
        strip.show()

    }


    /**
  *  Set the colors of the three LED lights
 
  */
    //% subcategory="LED Strip"
    //% blockId="LED_setPixelColor32" 
    //% block=" LED strip LED1: | red %red1  green %green1 blue %blue1, LED2: | red %red2 green %green2 blue %blue2,  LED3: | red %red3 green %green3 blue %blue3"
    //% red1.min=0 red1.max=255  green1.min=0 green1.max=255  blue1.min=0 blue1.max=255
    //% red2.min=0 red2.max=255  green2.min=0 green2.max=255  blue2.min=0 blue2.max=255
    //% red3.min=0 red3.max=255  green3.min=0 green3.max=255  blue3.min=0 blue3.max=255
    export function LED_setPixelColor32(red1: number, green1: number, blue1: number, red2: number, green2: number, blue2: number, red3: number, green3: number, blue3: number): void {
        //初始化LED数据
        if (bp) {
            strip = create(DigitalPin.P1, 3, NeoPixelMode.RGB)
            bp = false
        }
        strip.setPixelRGB(0 >> 0, packRGB(red1, green1, blue1) >> 0)
        strip.setPixelRGB(1 >> 0, packRGB(red2, green2, blue2) >> 0)
        strip.setPixelRGB(2 >> 0, packRGB(red3, green3, blue3) >> 0)
        strip.show()
    }

    /**
      * Gets the RGB value of a known color
     */
    //% weight=2 blockGap=8
    //% blockId="LED_colors" block="%color"
    //% subcategory="LED Strip"
    export function colors(color: NeoPixelColors): number {
        return color;
    }

    ///////////////////// 舵机模块 ///////////////////////
    export class MP_Servo {
        private _minAngle: number;
        private _maxAngle: number;
        private _stopOnNeutral: boolean;
        private _angle: number;

        constructor() {
            this._angle = undefined;
            this._minAngle = 0;
            this._maxAngle = 180;
            this._stopOnNeutral = false;
        }

        private clampDegrees(degrees: number): number {
            degrees = degrees | 0;
            degrees = Math.clamp(this._minAngle, this._maxAngle, degrees);
            return degrees;
        }


        setAngle(degrees: number) {
            degrees = this.clampDegrees(degrees);
            this.internalSetContinuous(false);
            this._angle = this.internalSetAngle(degrees);
        }

        get angle() {
            return this._angle || 90;
        }

        protected internalSetContinuous(continuous: boolean): void {

        }

        protected internalSetAngle(angle: number): number {
            return 0;
        }

        /**
         * Gets the minimum angle for the servo
         */
        public get minAngle() {
            return this._minAngle;
        }

        /**
         * Gets the maximum angle for the servo
         */
        public get maxAngle() {
            return this._maxAngle;
        }



        public setRange(minAngle: number, maxAngle: number) {
            this._minAngle = Math.max(0, Math.min(90, minAngle | 0));
            this._maxAngle = Math.max(90, Math.min(180, maxAngle | 0));
        }
    }

    export class MP_PinServo extends MP_Servo {
        private _pin: PwmOnlyPin;

        constructor(pin: PwmOnlyPin) {
            super();
            this._pin = pin;
        }

        protected internalSetAngle(angle: number): number {
            this._pin.servoWrite(angle);
            return angle;
        }

        protected internalSetContinuous(continuous: boolean): void {
            this._pin.servoSetContinuous(continuous);
        }

    }
    export const P1 = new MP_PinServo(pins.P1);

    /**
      * Gets the RGB value of a known color
     */
    //% weight=2 blockGap=8 
    //% blockId=servoservosetangle block="set angle to %degrees=protractorPicker °"

    //% subcategory="Servo"
    export function createServo(degrees: number) {
        P1.setAngle(degrees);
    }


    ///////////////////// 热释电模块 ///////////////////////

    /**
     * Read the specified pin or connector as either 0 or 1
     * @param name pin to read from, eg: DigitalPin.P0
     */
    //% help=pins/digital-read-pin weight=30
    //% blockId=MP_device_get_digital_pin block="read PIR sensor" blockGap=8
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    //% name.fieldOptions.tooltips="false" name.fieldOptions.width="250"
    //% subcategory="SPIR sensor"
    export function create_digitalReadPin(): number {
        return pins.digitalReadPin(DigitalPin.P0);
    }
    /**
       * Set a pin or connector value to either 0 or 1.
       * @param name pin to write to, eg: DigitalPin.P0
       * @param value value to set on the pin, 1 eg,0
       */
    //% help=pins/digital-write-pin weight=29
    //% blockId=MP_device_set_digital_pin block="digital write|pin|to %value"
    //% value.min=0 value.max=1
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    //% name.fieldOptions.tooltips="false" name.fieldOptions.width="250"
    //% subcategory="SPIR sensor"
    export function create_digitalWritePin(value: number): void {
        return pins.digitalWritePin(DigitalPin.P0, value);
    }


}