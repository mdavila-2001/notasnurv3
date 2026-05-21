import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileResponse } from '../../../../core/models/api.models';
import { Loader } from '../../../../shared/components/loader/loader';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, Loader],
  templateUrl: './profile-view.html',
  styleUrl: './profile-view.css',
})
export class ProfileView {
  profile = input<UserProfileResponse | null>(null);
  isLoading = input<boolean>(false);

  userInitials = computed(() => {
    const name = this.profile()?.fullName || '';
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  });
}
