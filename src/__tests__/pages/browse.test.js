import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Browse } from '../../pages';
import { FirebaseContext } from '../../context/firebase';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({}),
}));

jest.mock('../../utils', () => ({
  selectionFilter: () => ({
    series: [
      {
        title: 'Documentaries',
        data: [
          {
            id: 'series-1x',
            title: 'Tiger King',
            description:
              'An exploration of big cat breeding and its bizarre underworld, populated by eccentric characters.',
            genre: 'documentaries',
            maturity: '18',
            slug: 'tiger-king',
          },
        ],
      },
    ],
    films: [
      {
        title: 'Suspense',
        data: [
          {
            id: 'film-1x',
            title: 'Amanda Knox',
            description: 'Amanda Marie Knox is an American woman who spent almost four years in an Italian prison.',
            genre: 'documentaries',
            maturity: '12',
            slug: 'amanda-knox',
          },
        ],
      },
    ],
  }),
}));

const authInstance = {
  currentUser: { displayName: 'Karl', photoURL: 1, email: 'karlhadwen@gmail.com' },
  signOut: jest.fn(() => Promise.resolve('I am signed out!')),
};

const firebase = {
  auth: jest.fn(() => authInstance),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve('I get content!')),
      add: jest.fn(() => Promise.resolve('I add content!')),
    })),
  })),
};

describe('<Browse />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the browse page, searches, plays video, signs out', () => {
    const { getByTestId, getByText, queryByText } = render(
      <Router>
        <FirebaseContext.Provider value={{ firebase }}>
          <Browse />
        </FirebaseContext.Provider>
      </Router>
    );

    // 1. Advance timers to clear loading spinner
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // 2. Category tabs click
    fireEvent.click(getByText('Films'));
    expect(getByText('Amanda Knox')).toBeTruthy();

    fireEvent.click(getByText('Series'));
    expect(getByText('Tiger King')).toBeTruthy();

    // 3. Search interaction
    fireEvent.click(getByTestId('search-click'));
    const searchInput = getByTestId('search-input');
    
    // Type search term
    fireEvent.change(searchInput, { target: { value: 'tiger' } });
    expect(getByText('Tiger King')).toBeTruthy();

    // Type non-matching search term
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    expect(queryByText('Tiger King')).toBeFalsy();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(getByText('Tiger King')).toBeTruthy();

    // 4. Play video interaction
    const playButton = getByText('Play');
    fireEvent.click(playButton);

    // 5. Sign out click
    const signOutLink = getByText('Sign out');
    fireEvent.click(signOutLink);
    expect(authInstance.signOut).toHaveBeenCalled();
  });
});
