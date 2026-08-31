---
title: "How to Read Country Statistics Without Being Fooled"
description: "Six traps that make world rankings misleading — share-of-GDP ratios, inverted index scales, gross enrolment above 100%, and more. With worked examples from real datasets."
slug: "how-to-read-country-statistics"
date: "2026-08-31"
tags: [analysis, data-literacy]
datasets: [renewable-energy, healthcare-expenditure]
---

We build a daily game out of world datasets, which means we spend a lot of time looking at country rankings that are technically correct and completely misleading. The same handful of traps come up again and again.

Here they are, each with a real example you can check yourself.

## 1. A share of GDP is not an amount

The single most common trap. When an indicator is expressed as a percentage of GDP, the denominator moves — and in poor countries it moves a lot.

**Worked example:** Afghanistan spends **14.99% of GDP** on health. Qatar spends **2.52%**. Afghan life expectancy is **66.3 years**; Qatar's is **82.5**.

Afghanistan's high ratio is not generous healthcare. It is a small economy carrying a heavy disease burden. Across 193 countries, health spending share and life expectancy correlate at just **0.18** — essentially no relationship.

Before reading any "% of GDP" ranking as a measure of effort or quality, ask what happens to the ratio when a country gets richer.

→ [The full breakdown: healthcare spending vs life expectancy](/blog/healthcare-spending-vs-life-expectancy)

## 2. Check which way the index runs

Composite indices do not agree on direction, and ranking pages routinely sort them wrong.

**Worked example:** On the Reporters Without Borders press freedom index, **lower is better** — Norway scores **6.72**, Eritrea **81.45**. On Transparency International's corruption index, **higher is better** — Denmark **90**, South Sudan **8**.

Sort both "highest first" and you produce a leaderboard where Eritrea leads on press freedom. This is not hypothetical; it happens on published ranking pages regularly, including one on this site that we are fixing.

→ [Press freedom and corruption, and why the correlation is an upper bound](/blog/press-freedom-and-corruption)

## 3. "Renewable" may not mean what you think

Definitions inside an indicator matter more than the indicator's name.

**Worked example:** DR Congo gets **96.3%** of its energy from renewables — the highest share on earth, on a GDP per capita of **$649**. Kuwait gets **0.1%**.

The World Bank's renewable share includes traditional biomass: firewood, charcoal and dung. DR Congo's figure describes energy poverty, not an energy transition. Across 200 countries, renewable share correlates with income at **−0.24** — negatively, because industrialising countries substitute fossil fuels for wood.

→ [Why the world's "most renewable" countries are its poorest](/blog/renewable-energy-share-explained)

## 4. Some ratios legitimately exceed 100%

If a number looks impossible, check the definition before assuming an error.

**Worked example:** Greece records **165.1%** tertiary enrolment. This is a *gross* enrolment ratio — all enrolled students divided by the population of official university age. Mature students, repeat years and international students land in the numerator but not the denominator.

The consequence is practical: the difference between 97% and 142% is mostly noise, while the difference between 4% and 40% is real. Treat the top of such a scale as a band, not a ranking.

→ [Fertility and education across 150 countries](/blog/fertility-rate-vs-education)

## 5. A strong correlation is usually a proxy for something else

The tightest relationships in country data are rarely direct causes.

**Worked example:** Sanitation access and maternal mortality correlate at **−0.80**, stronger than income, doctors or health spending. Poor sanitation does cause some maternal deaths through infection — but it cannot carry a relationship that strong alone.

What sanitation coverage really measures at national scale is whether a state can deliver infrastructure to everyone. So does antenatal care. The plumbing and the midwives arrive together, because the same institutions deliver both.

→ [Sanitation and maternal mortality](/blog/sanitation-and-maternal-mortality)

## 6. Correlations are carried by one end of the range

Check whether a relationship holds everywhere or only where things are worst.

**Worked example:** Physician density and infant mortality correlate at **−0.73**. But almost all of that is the gap between Niger's **0.04 doctors per 1,000 people** and roughly 3 per 1,000. Above that, the line flattens: Belarus records **1.8** infant deaths per 1,000 with **4.72** physicians, better than Portugal's **2.7** with **5.85**.

The correlation says a lot about the difference between having a health system and not having one, and almost nothing about the difference between a good one and a slightly better one.

→ [Do more doctors mean fewer infant deaths?](/blog/doctors-per-capita-and-infant-mortality)

## The general rule

Before you quote a country ranking, ask three questions:

1. **What is the denominator, and does it move?**
2. **Which direction is good, and is the table sorted that way?**
3. **Is this measuring the thing, or something that comes bundled with it?**

Most misleading world statistics fail at least one of those, and almost none of them are wrong on the facts. They are just answering a different question from the one the headline implies.

If you want to practise reading choropleths quickly, that is more or less what our [daily map game](/) is — a world map shaded by a real dataset, and you work out which one. It builds the instinct faster than reading tables does.

All the data behind these examples is browsable in the [atlas](/atlas), with sources and years on every page.
