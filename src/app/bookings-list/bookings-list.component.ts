import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { Booking, Venue } from '../interfaces';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-bookings-list',
  templateUrl: './bookings-list.component.html',
  styles: [`
    .badge { text-transform: capitalize; }
  `],
  imports: [CurrencyPipe, CommonModule, ReactiveFormsModule],
  standalone: true
})
export class BookingsListComponent implements OnInit {
 
  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'confirmed':
        return 'badge bg-success';
      case 'pending':
        return 'badge bg-warning text-dark';
      case 'cancelled':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  constructor(private apiService: ApiService) { }

  venues: Venue[] = [];
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];

  searchTermGroup: FormGroup = new FormGroup({
    searchTerm: new FormControl('')
  });

  loadVenues() {
    this.apiService.getVenues().subscribe((venues) => {
      this.venues = venues;
    });
  }

  loadBookings() {
    this.apiService.getBookings().subscribe((bookings) => {
      this.bookings = bookings;
      this.filteredBookings = bookings;
    });
  }

  ngOnInit(): void {
    this.loadVenues();
    this.loadBookings();
    this.search();
  }

  getVenueName(venueId: string): string {
    const venue = this.venues.find(v => v.id === venueId);
    return venue ? venue.name : '';
  }

  search() {
    this.searchTermGroup.valueChanges.subscribe((value) => {
      const searchTerm = value.searchTerm?.toLowerCase() || '';
  
      if (!searchTerm) {
        this.filteredBookings = this.bookings;
        return;
      }
  
      this.filteredBookings = this.bookings.filter((booking) => {
        const companyName = booking.companyName?.toLowerCase() || '';
        const bookingCode = booking.bookingCode?.toLowerCase() || '';
  
        return (
          companyName.includes(searchTerm) ||
          bookingCode.includes(searchTerm)
        );
      });
    });
  }
  

}
