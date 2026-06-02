// EstateEdge — Apollo Client configuration + typed GraphQL queries

import { ApolloClient, InMemoryCache, createHttpLink, from, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { gql } from '@apollo/client';

// ─── Client Setup ─────────────────────────────────────────────────────────────

const httpLink = createHttpLink({
  uri:'http://localhost:4000/graphql',
});
console.log(import.meta.env.VITE_GRAPHQL_URL);

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('ee_access_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Site: { keyFields: ['id'] },
      Page: { keyFields: ['id'] },
      Lead: { keyFields: ['id'] },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});

// ─── Auth Queries ─────────────────────────────────────────────────────────────

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id email firstName lastName role avatarUrl
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id email firstName lastName role
      }
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id email firstName lastName role avatarUrl phone bio licenseNumber brokerageId
    }
  }
`;

// ─── Site Queries ─────────────────────────────────────────────────────────────

export const MY_SITES_QUERY = gql`
  query MySites {
    mySites {
      id name slug subdomain domain status aiGenerated
      theme seo publishedAt createdAt updatedAt
    }
  }
`;

export const SITE_QUERY = gql`
  query Site($id: ID!) {
    site(id: $id) {
      id name slug subdomain domain status theme seo settings aiGenerated publishedAt
      pages {
        id title slug pageType status sortOrder seo
      }
    }
  }
`;

export const SITE_PAGES_QUERY = gql`
  query SitePages($siteId: ID!) {
    sitePages(siteId: $siteId) {
      id title slug pageType content seo status sortOrder
    }
  }
`;

export const GENERATE_SITE_MUTATION = gql`
  mutation GenerateSite($input: SiteGenerationInput!) {
    generateSite(input: $input) {
      id status siteId createdAt updatedAt 
    }
  }
`;

export const GENERATION_JOB_QUERY = gql`
  query GenerationJob($jobId: ID!) {
    generationJob(jobId: $jobId) {
      id status siteId tokensUsed durationMs error createdAt updatedAt
    }
  }
`;

export const PUBLISH_SITE_MUTATION = gql`
  mutation PublishSite($siteId: ID!) {
    publishSite(siteId: $siteId) {
      id status publishedAt subdomain domain
    }
  }
`;

// ─── AI Content Queries ───────────────────────────────────────────────────────

export const GENERATE_CONTENT_MUTATION = gql`
  mutation GenerateContent($input: ContentGenerationInput!) {
    generateContent(input: $input) {
      content tokensUsed model
    }
  }
`;

export const GENERATE_MARKET_REPORT_MUTATION = gql`
  mutation GenerateMarketReport($input: MarketReportInput!) {
    generateMarketReport(input: $input) {
      title summary keyInsights buyerAdvice sellerAdvice outlook
    }
  }
`;

// ─── Leads & Analytics ────────────────────────────────────────────────────────

export const MY_LEADS_QUERY = gql`
  query MyLeads($siteId: ID!) {
    myLeads(siteId: $siteId) {
      id email firstName lastName phone source status score metadata createdAt
    }
  }
`;

export const SITE_ANALYTICS_QUERY = gql`
  query SiteAnalytics($siteId: ID!, $days: Int) {
    siteAnalytics(siteId: $siteId, days: $days) {
      siteId pageViews uniqueVisitors leadsCaptured avgSessionDuration bounceRate
      topPages trafficSources
    }
  }
`;