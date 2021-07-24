import {RRule} from 'rrule';

export default class Ccycle {

    static getEvents(data, menuTimeSections) {

        let events = [];

        if (!data) return events;

        const repetitions = Ccycle.getRepetitions(data);

        repetitions.forEach(av => {

            let index = 0;

            av.menus.forEach(m => {

                let event = {};
                let start = new Date(av.createdAt);
                let end = new Date(av.createdAt);

                start.setHours(av.menuTimeSection.start);
                start.setMinutes(av.menuTimeSection.startMinutes);
                end.setHours(av.menuTimeSection.end);
                end.setMinutes(av.menuTimeSection.endMinutes);

                start.setDate(start.getDate() + index);
                end.setDate(end.getDate() + index);

                event.start = start;
                event.end = end;
                event.content = m.name;
                event.selectable = true;
                event.menu_id = m.id;
                event.color = av.menuTimeSection.color;
                event.index = index;
                event.interval = av.interval;
                event.menuTimeSections = menuTimeSections;
                event.wheel = av.id;
                event.wheel_obj = av;

                events.push(event);
                index++;

            })

        });

        return events;


    }

    static getRepetition(av) {

        const MSDAY = 86400000;


        let dStart = new Date(av.createdAt);
        let dUntil = new Date(av.repeatUntil);
        let diff = 0;
        let interval = av.interval;

        if (av.repeatFrom) {
            let dFrom = new Date(av.repeatFrom);
            diff = Math.floor((dFrom - dStart) / MSDAY);
            interval += Math.abs(interval - diff);
        }


        return new RRule({
            freq: RRule.DAILY,
            interval: interval,
            dtstart: dStart,
            until: dUntil
        }).all()

    }

    static getRepetitions(data) {
        let reps = [];

        data.forEach(d => {
            if (!d.repeatUntil) {
                reps.push(d);
            } else {

                let sequence = Ccycle.getRepetition(d);

                sequence.forEach(s => {
                    let newS = Object.assign({}, d);
                    newS.createdAt = s;
                    newS.originalAt = d.createdAt;
                    reps.push(newS);
                });

            }
        });

        return reps;
    }

    static isToday(date) {
        const today = new Date();

        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
            ;
    }

    static filterEvent(e, strict) {

        const now = new Date().getTime();

        const startDate = new Date(e.start).getTime();
        const endDate = new Date(e.end).getTime();


        return strict ? Boolean(startDate <= now & endDate >= now) : Boolean(startDate <= now);

    }

    static matchWheelElement(device, menuWheel, strict) {

        const {menuDishDevices} = device;

        let matchedEvents = [];
        let matches = [];

        let menuDishes = menuDishDevices.map(md => {
            return md.menuDish;
        });

        const events = Ccycle.getEvents(menuWheel);

        events.forEach(e => {

            const eventDate = new Date(e.start);

            const today = Ccycle.isToday(eventDate);

            if (today) {
                if (Ccycle.filterEvent(e, strict)) {
                    matchedEvents.push(e);
                }
            }

        });


        menuDishes.forEach(md => {
            matchedEvents.forEach(e => {
                if (e.menu_id === md.menu.id) {
                    matches.push(Object.assign(e, md));
                }
            });
        });

        return matches;

    }
}
