import { ref, set } from "firebase/database";
import * as dbConnect from './firebaseService';
export const updateLocationByUserId = (userId, city, lat, lng) => {
    return new Promise((resolve) => {
        if (userId && city ) {
            dbConnect.getCityWiseDatabase(city).then((res) => {
                set(ref(res.db, `/EntityMarkingData/locationHistory/${userId}/`), { lat, lng });
                resolve('success');
            });
        }
        else {
            console.log(`Error saving location : userId : ${userId},city : ${city},lat : ${lat},lng : ${lng}`);
        }
    });
};