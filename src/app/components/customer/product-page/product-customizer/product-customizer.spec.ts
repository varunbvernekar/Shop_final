import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCustomizer } from './product-customizer';

describe('ProductCustomizer', () => {
  let component: ProductCustomizer;
  let fixture: ComponentFixture<ProductCustomizer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCustomizer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductCustomizer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
