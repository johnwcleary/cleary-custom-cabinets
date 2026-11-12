/**
 * Storyblok components (the editing screens the customer sees), defined in code so the space can be
 * recreated exactly. Labels are written for the customer; technical fields sit on a separate tab.
 *
 * Field keys are snake_case (Storyblok convention) and map 1:1 onto src/content in model.ts.
 */

type Field = Record<string, unknown> & { type: string };
type Schema = Record<string, Field>;
export type Component = {
  name: string;
  display_name: string;
  is_root: boolean;
  is_nestable: boolean;
  preview_field?: string;
  schema: Schema;
};

/** Assigns `pos` in declaration order and turns `tabs` into Storyblok tab fields. */
function fields(main: Record<string, Field>, tabs: Record<string, Record<string, Field>> = {}): Schema {
  const out: Schema = {};
  let pos = 0;
  for (const [k, f] of Object.entries(main)) out[k] = { ...f, pos: pos++ };
  for (const [label, group] of Object.entries(tabs)) {
    const keys = Object.keys(group);
    out[`tab-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`] = { type: 'tab', display_name: label, keys, pos: pos++ };
    for (const [k, f] of Object.entries(group)) out[k] = { ...f, pos: pos++ };
  }
  return out;
}

/** Fields arranged in labelled groups (Storyblok "Group" fields), plus tabs as in fields(). */
function grouped(groups: Record<string, Record<string, Field>>, tabs: Record<string, Record<string, Field>> = {}): Schema {
  const out: Schema = {};
  let pos = 0;
  for (const [label, group] of Object.entries(groups)) {
    out[`group-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`] = { type: 'section', display_name: label, keys: Object.keys(group), pos: pos++ };
    for (const [k, f] of Object.entries(group)) out[k] = { ...f, pos: pos++ };
  }
  const rest = fields({}, tabs);
  for (const [k, f] of Object.entries(rest)) out[k] = { ...f, pos: pos++ };
  return out;
}

const text = (display_name: string, extra: Record<string, unknown> = {}) => ({ type: 'text', display_name, ...extra });
const textarea = (display_name: string, extra: Record<string, unknown> = {}) => ({ type: 'textarea', display_name, ...extra });
const image = (display_name: string, extra: Record<string, unknown> = {}) => ({ type: 'asset', display_name, filetypes: ['images'], ...extra });
const blocks = (display_name: string, only: string[], extra: Record<string, unknown> = {}) => ({
  type: 'bloks',
  display_name,
  restrict_components: true,
  component_whitelist: only,
  ...extra,
});

const searchTab = {
  title: text('Page name', { required: true, description: 'Used inside the site; visitors rarely see it.' }),
  seo_title: text('Title in Google results', { required: true }),
};

export const COMPONENTS: Component[] = [
  {
    name: 'business_details',
    display_name: 'Business details',
    is_root: true,
    is_nestable: false,
    schema: fields(
      {
        announcement: text('Announcement bar', {
          description: 'Optional, e.g. a promotion. Shown in the strip at the top of every page; leave empty to show the area you serve.',
        }),
        business_name: text('Business name', { required: true }),
        tagline: textarea('Footer tagline', { description: 'The large line at the bottom of every page. The business name in it is set upright.' }),
        phone: text('Phone', { required: true, description: 'Written the way it should appear, e.g. 516.939.2475' }),
        email: text('Email', { required: true }),
        street: text('Street address', { required: true }),
        city: text('Town', { required: true }),
        state: text('State', { required: true }),
        zip: text('ZIP code', { required: true }),
        hours: blocks('Showroom hours', ['hours_row'], { required: true }),
        service_area: text('Area you serve'),
        services: textarea('Services (one per line)'),
        clients: textarea('Clients (one per line)'),
      },
      {
        'Social links': {
          instagram: text('Instagram link'),
          facebook: text('Facebook link'),
          houzz: text('Houzz link'),
        },
        'Search engines': {
          meta_description: textarea('Description shown in Google results'),
        },
      },
    ),
  },
  {
    name: 'hours_row',
    display_name: 'Hours',
    is_root: false,
    is_nestable: true,
    preview_field: 'days',
    schema: fields({
      days: text('Days', { required: true, description: 'e.g. Mon, Tue, Wed, Fri' }),
      closed: { type: 'boolean', display_name: 'Closed these days', default_value: false },
      open: text('Opens', { description: 'e.g. 8:00 AM' }),
      close: text('Closes', { description: 'e.g. 4:30 PM' }),
    }),
  },
  {
    name: 'home_page',
    display_name: 'Home page',
    is_root: true,
    is_nestable: false,
    // Grouped in the order the sections appear on the page. Phone, email, address and hours come
    // from Business details; the cabinet tiles from each cabinet page (main photo and short name).
    schema: grouped(
      {
        'Top of the page': {
          hero_title: text('Big headline', { required: true }),
          hero_subtitle: text('Line under the headline'),
          hero_image: image('Main photo', { required: true }),
          hero_caption: text('Photo caption', { description: 'Also read aloud to visitors who cannot see the photo.' }),
          hero_photos: blocks('More slideshow photos', ['photo'], { description: 'Shown after the main photo, before one photo from each cabinet page.' }),
        },
        'About us': {
          about_label: text('Small heading'),
          about_heading: textarea('Large sentence'),
          about_text: textarea('Text'),
          about_button: text('Button'),
        },
        'Cabinets & products': {
          cabinets_label: text('Small heading', { description: 'The tiles below it come from the cabinet pages.' }),
        },
        Materials: {
          materials_label: text('Small heading'),
          cabinetry_heading: text('First list heading'),
          cabinetry_materials: textarea('First list (one per line)'),
          countertops_heading: text('Second list heading'),
          countertops_materials: textarea('Second list (one per line)'),
        },
        Showroom: {
          showroom_label: text('Small heading'),
          showroom_text: textarea('Large sentence', { description: 'Address and hours come from Business details.' }),
          showroom_button: text('Button'),
        },
        'Contact (bottom of the page)': {
          contact_label: text('Small heading'),
          contact_heading: textarea('Large heading'),
          contact_button: text('Button', { description: 'The email button shows the email from Business details.' }),
        },
      },
      { 'Search engines': searchTab },
    ),
  },
  {
    name: 'about_page',
    display_name: 'About page',
    is_root: true,
    is_nestable: false,
    schema: fields(
      {
        body: { type: 'markdown', display_name: 'About us text', rich_markdown: true },
        photos: blocks('Photos', ['photo']),
      },
      { 'Search engines': searchTab },
    ),
  },
  {
    name: 'contact_page',
    display_name: 'Contact page',
    is_root: true,
    is_nestable: false,
    schema: fields(
      {
        lead: textarea('Introduction'),
        form_helper: text('Note under the message box'),
      },
      { 'Search engines': searchTab },
    ),
  },
  {
    name: 'photo',
    display_name: 'Photo',
    is_root: false,
    is_nestable: true,
    preview_field: 'caption',
    schema: fields({
      image: image('Photo', { required: true }),
      caption: text('Caption', { required: true, description: 'Also read aloud to visitors who cannot see the photo.' }),
    }),
  },
  {
    name: 'cabinet_page',
    display_name: 'Cabinet page',
    is_root: true,
    is_nestable: false,
    schema: fields(
      {
        title: text('Page title', { required: true }),
        short_name: text('Short name', { description: 'One or two words for the home page tiles and the menu, e.g. Kitchens.' }),
        intro: textarea('Opening sentence'),
        hero_image: image('Main photo', { required: true }),
        photos: blocks('Photos', ['gallery_photo'], { description: 'Drag to change the order.' }),
        closing: textarea('Closing sentence'),
        closing_aside: textarea('Extra closing line'),
        brands: blocks('Brands we carry', ['featured_brand'], { description: 'Optional. A short description of each brand and a link to its website.' }),
        video_title: text('Video title'),
        video_url: text('Video link (Vimeo or YouTube)'),
      },
      {
        'Search engines': {
          seo_title: text('Title in Google results', { required: true }),
          legacy_path: text('Address on the old website', { description: 'Used to redirect old links. Leave as is.' }),
          order: { type: 'number', display_name: 'Position in menus', description: '1 comes first.' },
        },
      },
    ),
  },
  {
    name: 'featured_brand',
    display_name: 'Brand on a cabinet page',
    is_root: false,
    is_nestable: true,
    preview_field: 'name',
    schema: fields({
      name: text('Brand name', { required: true }),
      url: text('Website link', { description: 'Opens in a new tab.' }),
      about: textarea('Short description', { required: true, description: 'One or two sentences, in your own words.' }),
    }),
  },
  {
    name: 'gallery_photo',
    display_name: 'Photo',
    is_root: false,
    is_nestable: true,
    preview_field: 'caption',
    schema: fields({
      image: image('Photo', { required: true }),
      caption: text('Caption', { required: true, description: 'Also read aloud to visitors who cannot see the photo.' }),
      featured: { type: 'boolean', display_name: 'Show large', default_value: false },
    }),
  },
  {
    name: 'lines_page',
    display_name: 'Lines we distribute',
    is_root: true,
    is_nestable: false,
    schema: fields({ groups: blocks('Groups', ['brand_group']) }),
  },
  {
    name: 'brand_group',
    display_name: 'Group',
    is_root: false,
    is_nestable: true,
    preview_field: 'label',
    schema: fields({
      label: text('Group name', { required: true, description: 'e.g. Quartz' }),
      brands: blocks('Brands', ['brand']),
    }),
  },
  {
    name: 'brand',
    display_name: 'Brand',
    is_root: false,
    is_nestable: true,
    preview_field: 'name',
    schema: fields({
      name: text('Brand name', { required: true }),
      url: text('Website link'),
    }),
  },
];

/** Components a brand-new Storyblok space ships with; removed once nothing uses them. */
export const STARTER_COMPONENTS = ['page', 'grid', 'feature', 'teaser'];
