import { UUID } from '../domains/UUID';
import { Cuid } from '../domains/Cuid';
import { ICommunityEventVolunteer } from '../interfaces/ICommunityEventVolunteer';
import type { CommunityEventVolunteer as SharedCommunityEventVolunteer } from '@kapa/shared';

export class CommunityEventVolunteer implements ICommunityEventVolunteer {
  private volunteerId!: UUID;
  private communityEventId!: Cuid;

  public getVolunteerId(): UUID {
    return this.volunteerId;
  }

  public getCommunityEventId(): Cuid {
    return this.communityEventId;
  }

  public setVolunteerId(id: string | UUID): void {
    if (this.volunteerId) {
      return;
    }
    this.volunteerId = id instanceof UUID ? id : UUID.create(id);
  }

  public setCommunityEventId(id: string | Cuid): void {
    if (this.communityEventId) {
      return;
    }
    this.communityEventId = id instanceof Cuid ? id : Cuid.create(id);
  }

  public toDTO(): SharedCommunityEventVolunteer {
    return {
      volunteerId: this.volunteerId ? this.volunteerId.getValue() : '',
      communityEventId: this.communityEventId ? this.communityEventId.getValue() : '',
    };
  }

  public toJSON(): SharedCommunityEventVolunteer {
    return this.toDTO();
  }
}

