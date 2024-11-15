import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Booking, Service, Venue } from './interfaces';
import { environment } from './environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private httpClient: HttpClient) { }

  getVenues():Observable<Venue[]> {
    return this.httpClient.get<Venue[]>(environment.apiVenues);
  }

  getBookings():Observable<Booking[]> {
    return this.httpClient.get<Booking[]>(environment.apiBookings);
  }

  getService():Observable<Service[]> {
    return this.httpClient.get<Service[]>(environment.apiServices);
  }

  getAvailability(venueId: string, date: string): Observable<boolean> {
    return this.httpClient.get<boolean>(`${environment.apiAvailability}?venueId=${venueId}&date=${date}`);
  }

  createBooking(booking: Booking): Observable<Booking> {
    return this.httpClient.post<Booking>(environment.apiBookings, booking);
  }
}
