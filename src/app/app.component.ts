import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';

interface Student {
  id: number;
  studentId: number;
  firstName: string;
  lastName: string;
  dob: string;
  className: string;
  score: number;
}

interface PageResponse {
  content: Student[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  first: boolean;
  last: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'compulynx-frontend';
  activeTab = 'generate';
  
  // API Base URL
  private apiUrl = 'http://localhost:8080/api/data';
  
  // Generate Data
  recordCount: number = 1000;
  isLoading = false;
  generateMessage = '';
  generateSuccess = false;
  
  // Process Excel
  selectedExcelFile: File | null = null;
  processMessage = '';
  processSuccess = false;
  
  // Upload CSV
  selectedCsvFile: File | null = null;
  uploadMessage = '';
  uploadSuccess = false;
  
  // Report
  students: Student[] = [];
  classes: string[] = [];
  searchStudentId: number | null = null;
  filterClass = '';
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  
  // Math reference for template
  Math = Math;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadClasses();
    this.loadStudents();
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'report') {
      this.loadStudents();
    }
  }

  // Generate Excel File
  generateExcel() {
    if (!this.recordCount || this.recordCount < 1) {
      this.generateMessage = 'Please enter a valid number of records';
      this.generateSuccess = false;
      return;
    }

    this.isLoading = true;
    this.generateMessage = '';

    const params = new HttpParams().set('recordCount', this.recordCount.toString());

    this.http.post<any>(`${this.apiUrl}/generate-excel`, null, { params })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.generateMessage = `Excel file generated successfully with ${response.recordCount} records. File: ${response.fileName}`;
            this.generateSuccess = true;
          } else {
            this.generateMessage = response.message;
            this.generateSuccess = false;
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.generateMessage = 'Error generating Excel file: ' + (error.error?.message || error.message);
          this.generateSuccess = false;
        }
      });
  }

  // File Selection
  onExcelFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedExcelFile = file;
      this.processMessage = '';
    }
  }

  onCsvFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedCsvFile = file;
      this.uploadMessage = '';
    }
  }

  // Process Excel to CSV
  processExcel() {
    if (!this.selectedExcelFile) {
      this.processMessage = 'Please select an Excel file';
      this.processSuccess = false;
      return;
    }

    this.isLoading = true;
    this.processMessage = '';

    const formData = new FormData();
    formData.append('file', this.selectedExcelFile);

    this.http.post<any>(`${this.apiUrl}/process-excel`, formData)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.processMessage = `Excel file processed successfully to CSV. File: ${response.csvFileName}`;
            this.processSuccess = true;
          } else {
            this.processMessage = response.message;
            this.processSuccess = false;
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.processMessage = 'Error processing Excel file: ' + (error.error?.message || error.message);
          this.processSuccess = false;
        }
      });
  }

  // Upload CSV to Database
  uploadCsv() {
    if (!this.selectedCsvFile) {
      this.uploadMessage = 'Please select a CSV file';
      this.uploadSuccess = false;
      return;
    }

    this.isLoading = true;
    this.uploadMessage = '';

    const formData = new FormData();
    formData.append('file', this.selectedCsvFile);

    this.http.post<any>(`${this.apiUrl}/upload-csv`, formData)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.uploadMessage = response.message;
            this.uploadSuccess = true;
          } else {
            this.uploadMessage = response.message;
            this.uploadSuccess = false;
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.uploadMessage = 'Error uploading CSV file: ' + (error.error?.message || error.message);
          this.uploadSuccess = false;
        }
      });
  }

  // Load Classes
  loadClasses() {
    this.http.get<string[]>(`${this.apiUrl}/classes`)
      .subscribe({
        next: (classes) => {
          this.classes = classes;
        },
        error: (error) => {
          console.error('Error loading classes:', error);
        }
      });
  }

  // Load Students
  loadStudents() {
    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('size', this.pageSize.toString());

    if (this.searchStudentId) {
      params = params.set('studentId', this.searchStudentId.toString());
    }

    if (this.filterClass) {
      params = params.set('className', this.filterClass);
    }

    this.http.get<PageResponse>(`${this.apiUrl}/students`, { params })
      .subscribe({
        next: (response) => {
          this.students = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          this.currentPage = response.currentPage;
        },
        error: (error) => {
          console.error('Error loading students:', error);
        }
      });
  }

  // Clear Filters
  clearFilters() {
    this.searchStudentId = null;
    this.filterClass = '';
    this.currentPage = 0;
    this.loadStudents();
  }

  // Pagination
  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadStudents();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5; // Show max 5 page numbers
    const start = Math.max(0, this.currentPage - Math.floor(maxPages / 2));
    const end = Math.min(this.totalPages, start + maxPages);

    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Export Functions
  exportReport(format: string) {
    let params = new HttpParams().set('format', format);

    if (this.filterClass) {
      params = params.set('className', this.filterClass);
    }

    this.http.get(`${this.apiUrl}/students/export`, { 
      params, 
      responseType: 'blob' 
    }).subscribe({
      next: (data) => {
        const blob = new Blob([data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        let fileName = 'students_report';
        switch (format) {
          case 'excel':
            fileName += '.xlsx';
            break;
          case 'csv':
            fileName += '.csv';
            break;
          case 'pdf':
            fileName += '.pdf';
            break;
        }
        
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting report:', error);
      }
    });
  }
}