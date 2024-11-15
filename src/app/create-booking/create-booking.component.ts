import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { Booking, Service, Venue } from '../interfaces';
import { catchError, map, Observable, of } from 'rxjs';

@Component({
  selector: 'app-create-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-booking.component.html',
  styleUrl: './create-booking.component.css'
})
export class CreateBookingComponent implements OnInit {

  constructor(private apiService: ApiService) { }

  venues: Venue [] = []; 
  services: Service [] = [];
  subTotal: number = 0;
  discount: number = 0;
  total: number = 0;
  orderCode: number = 0;

  bookingForm = new FormGroup({
    companyName: new FormControl('', [Validators.required, Validators.minLength(5)]),
    companyEmail: new FormControl('', [Validators.required, Validators.email]),
    contactPhone: new FormControl('', Validators.required),
    venueId: new FormControl('', Validators.required),
    eventDate: new FormControl('', Validators.required, this.checkAvailability()),
    startTime: new FormControl('', Validators.required),
    endTime: new FormControl('', [Validators.required]),
    totalPeople: new FormControl(0, Validators.required),
    services: new FormArray([], [Validators.required]),
    totalAmount: new FormControl(0),
  }, { validators: this.timeValidator }
);

  get servicesFormArray() {
    return this.bookingForm.get('services') as FormArray;
  }

  addService() {
    const serviceGroup = new FormGroup({
      serviceId: new FormControl('', Validators.required),
      quantity: new FormControl('', [Validators.required, Validators.min(11)]),
      startTime: new FormControl('', Validators.required),
      endTime: new FormControl('', Validators.required),
      subTotal: new FormControl(0)
    });
  
    serviceGroup.get('serviceId')?.valueChanges.subscribe(() => {
      this.calculateSubTotal(serviceGroup);
    });

    serviceGroup.get('quantity')?.valueChanges.subscribe(() => {
      this.calculateSubTotal(serviceGroup);
    });

    this.bookingForm.get('totalPeople')?.valueChanges.subscribe(() => {
      this.calculateTotal();
    });

    this.bookingForm.get('services')?.valueChanges.subscribe(() => {
      this.calculateTotal();
    });
  
    this.servicesFormArray.push(serviceGroup);
  }
  

  removeService(index: number){
    this.servicesFormArray.removeAt(index);
  }

  ngOnInit(): void {
    this.loadVenues();
    this.loadServices();
    this.addService();

    this.bookingForm.valueChanges.subscribe(() => {
      this.calculateTotal();
    });
  }

  loadVenues() {
    this.apiService.getVenues().subscribe((venues) => {
      this.venues = venues;
    });
  }

  loadServices() {
    this.apiService.getService().subscribe((services) => {
      this.services = services;
    });
  }


  calculateSubTotal(serviceGroup: FormGroup) {
    const serviceId = serviceGroup.get('serviceId')?.value;
    const quantity = serviceGroup.get('quantity')?.value;
  
    const service = this.services.find(s => s.id === serviceId);
  
    if (service) {
      const subTotal = quantity && quantity > 0 ? service.pricePerPerson * Number(quantity) : 0.00;
      serviceGroup.patchValue({
        subTotal: subTotal
      });
    }
  }

  calculateTotal() {
    this.subTotal = 0;
    this.discount = 0;
    this.total = 0;
  
    this.servicesFormArray.controls.forEach((serviceGroup) => {
      const subTotal = serviceGroup.get('subTotal')?.value || 0;
      this.subTotal += subTotal;
    });
  
    this.subTotal =  Number((this.subTotal + this.calculatePricePerVenue()).toFixed(2));
    const totalPeople = this.bookingForm.get('totalPeople')?.value || 0;
    if (totalPeople >= 100) {
      this.discount = this.subTotal * 0.15;
    }


    this.total = this.subTotal - this.discount;
  }
  

  calculatePricePerVenue() {
    const venueId = this.bookingForm.get('venueId')?.value;
    const venue = this.venues.find(v => v.id === venueId);

    if(venue){
      const startTime = this.bookingForm.get('startTime')?.value;
      const endTime = this.bookingForm.get('endTime')?.value;
      const start = new Date(`01/01/2021 ${startTime}`);
      const end = new Date(`01/01/2021 ${endTime}`);

      const totalHours = (end.getTime() - start.getTime()) / 1000 / 60 / 60;

      return venue.pricePerHour * totalHours;

    }else{
      return 0;
    }
  }

  timeValidator(group: AbstractControl): ValidationErrors | null {
    if (!(group instanceof FormGroup)) {
      return null;
    }

    const startTime = group.get('startTime')?.value;
    const endTime = group.get('endTime')?.value;

    if (!startTime || !endTime) {
      return null;
    }

    const start = new Date(`01/01/2000 ${startTime}`);
    const end = new Date(`01/01/2000 ${endTime}`);

    if (start >= end) {
      return { timeError: true };
    }

    return null;
  }

  get hasTimeError(): boolean {
    return this.bookingForm.errors?.['timeError'] === true;
  }

  checkAvailability(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const venueId = this.bookingForm.get('venueId')?.value;
      const eventDate = this.bookingForm.get('eventDate')?.value;

      console.log('venueId', venueId);
      console.log('eventDate', eventDate);
  
      if (!venueId || !eventDate) {
        return of(null);
      }
  
      return this.apiService.getAvailability(venueId, eventDate).pipe(
        map((response) => {
          if (Array.isArray(response)) {
            const availabilityRecord = response.find(
              (record: { venueId: any; date: any; available: boolean }) =>
                record.venueId === venueId && record.date === eventDate
            );

            return availabilityRecord?.available ? null : { unavailable: true };
          } else {
            console.error('Respuesta de API no es un arreglo:', response);
            return { apiError: true };
          }
        }),
        catchError((error) => {
          console.error('Error al verificar disponibilidad:', error);
          return of({ apiError: true });
        })
      );
    };
  }

  generateBookingCode(){
    this.orderCode = Math.floor(100000 + Math.random() * 900000);
  }


  createBooking(){
    this.generateBookingCode();
    const booking = this.bookingForm.value;
    const bookingCreated: Booking = {
      bookingCode: this.orderCode.toString(),
      companyName: booking.companyName || '',
      companyEmail: booking.companyEmail || '',
      contactPhone: booking.contactPhone || '',
      venueId: booking.venueId || '',
      eventDate: booking.eventDate ? new Date(booking.eventDate) : new Date(),
      startTime: booking.startTime || '',
      endTime: booking.endTime || '',
      totalPeople: booking.totalPeople || 0,
      services: booking.services || [],
      totalAmount: this.total,
      status: 'confirmed',
      createdAt: new Date(),
    };

    this.apiService.createBooking(bookingCreated).subscribe((response) => {
      console.log('Reserva creada:', response);
    });

  }

}