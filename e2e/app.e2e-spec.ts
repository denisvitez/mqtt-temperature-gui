import { MissionControlGUIPage } from './app.po';

describe('mission-control-gui App', function() {
  let page: MissionControlGUIPage;

  beforeEach(() => {
    page = new MissionControlGUIPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
