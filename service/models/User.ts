interface keyable {
  [key: string]: any;
}

export class User {
  userId!: string;
  description!: string;
  bookmarks!: string[];
  profilePhoto!: string;
  coverPhoto!: string;
  userTag!: string;
  publicKey!: string;
  followers!: string[];
  following!: string[];
  socialLinks!: string;
  appId?: string;

  constructor(userData: keyable = {}) {
    Object.assign(this, userData);
    if (userData.socialLinks) {
      this.setSocialLinks(userData.socialLinks);
    }
  }

  setSocialLinks(socialLinks: object) {
    this.socialLinks = JSON.stringify(socialLinks);
  }

  getSocialLinks() {
    return JSON.parse(this.socialLinks || '{}');
  }

  public makeObject() {
    return {
      userId: this.userId,
      description: this.description,
      bookmarks: this.bookmarks,
      profilePhoto: this.profilePhoto,
      coverPhoto: this.coverPhoto,
      userTag: this.userTag,
      publicKey: this.publicKey,
      followers: this.followers,
      following: this.following,
      socialLinks: this.getSocialLinks(),
      appId: this.appId
    };
  }
}
