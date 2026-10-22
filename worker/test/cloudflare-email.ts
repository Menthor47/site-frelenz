// Înlocuitorul lui `cloudflare:email` din teste: aceeași semnătură ca `EmailMessage` din runtime-ul Workers.
export class EmailMessage {
  constructor(
    readonly from: string,
    readonly to: string,
    readonly raw: string,
  ) {}
}
