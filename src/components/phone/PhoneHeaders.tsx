import { dataStore } from '../../data/datastore';

function ProfileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" viewBox="0 0 19.422 21.363">
        <path id="Path_1327" data-name="Path 1327" d="M15.711,5a6.8,6.8,0,0,0-3.793,12.442A9.739,9.739,0,0,0,6,26.364H7.942a7.769,7.769,0,1,1,15.537,0h1.942A9.739,9.739,0,0,0,19.5,17.442,6.8,6.8,0,0,0,15.711,5Zm0,1.942A4.855,4.855,0,1,1,10.855,11.8,4.841,4.841,0,0,1,15.711,6.942Z" transform="translate(-6 -5)" fill="#fff"></path>
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" data-name="Group 14" width="40" height="40" viewBox="0 0 47 47">
        <g id="Ellipse_6" data-name="Ellipse 6" fill="none" stroke="#262626" stroke-width="1">
        <circle cx="23.5" cy="23.5" r="23.5" stroke="none"></circle>
        <circle cx="23.5" cy="23.5" r="23" fill="none"></circle>
        </g>
        <path id="Icon_ionic-ios-arrow-round-up" data-name="Icon ionic-ios-arrow-round-up" d="M13.242,7.334a.919.919,0,0,1-1.294.007L7.667,3.073V19.336a.914.914,0,0,1-1.828,0V3.073L1.557,7.348A.925.925,0,0,1,.263,7.341.91.91,0,0,1,.27,6.054L6.106.26h0A1.026,1.026,0,0,1,6.394.07.872.872,0,0,1,6.746,0a.916.916,0,0,1,.64.26l5.836,5.794A.9.9,0,0,1,13.242,7.334Z" transform="translate(13 30.501) rotate(-90)" fill="#262626"></path>
    </svg>
  );
}

export function PhoneAppHeader() {
  const logo: string | undefined = dataStore.get('OrganisationLogo');
  return (
    <div className="phone-app-header">
      <div className="phone-app-logo">
        {logo
          ? <img src={logo} alt="Organisation logo" className="phone-app-logo-img" />
          : <div className="phone-app-logo-placeholder" />
        }
      </div>
      <div className="phone-app-profile">
        <ProfileIcon />
      </div>
    </div>
  );
}

export function PhoneLinkedHeader({ pageName, onBack }: { pageName: string; onBack: () => void }) {
  return (
    <div className="phone-app-header phone-linked-header">
      <button className="phone-back-btn" type="button" aria-label="Go back" onClick={onBack}>
        <BackArrowIcon />
      </button>
      <span className="phone-linked-page-name">{pageName.toUpperCase()}</span>
    </div>
  );
}
